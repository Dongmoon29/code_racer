package service

import (
	"context"
	"crypto/rand"
	"errors"
	"fmt"
	"math/big"
	"time"

	"github.com/Dongmoon29/code_racer/internal/apperr"
	"github.com/Dongmoon29/code_racer/internal/events"
	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/Dongmoon29/code_racer/internal/repository"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

// matchLifecycleService owns match creation, lookup, and termination.
type matchLifecycleService struct {
	matches       repository.MatchRepository
	problems      repository.ProblemRepository
	redis         *redis.Client
	state         *RedisManager
	reconnections *reconnectionService
	events        events.EventBus
	logger        logger.Logger
}

func newMatchLifecycleService(matches repository.MatchRepository, problems repository.ProblemRepository, redisClient *redis.Client, state *RedisManager, reconnections *reconnectionService, eventBus events.EventBus, appLogger logger.Logger) *matchLifecycleService {
	return &matchLifecycleService{matches: matches, problems: problems, redis: redisClient, state: state, reconnections: reconnections, events: eventBus, logger: appLogger}
}

func (s *matchLifecycleService) CreateMatch(ctx context.Context, player1ID, player2ID uuid.UUID, difficulty, mode string) (*model.Match, error) {
	if !model.Difficulty(difficulty).IsValid() {
		return nil, apperr.New(apperr.CodeBadRequest, "Invalid difficulty")
	}
	matchMode := model.MatchMode(mode)
	if matchMode != model.MatchModeCasualPVP && matchMode != model.MatchModeRankedPVP {
		return nil, apperr.New(apperr.CodeBadRequest, "Invalid match mode")
	}
	problem, err := s.RandomProblem(difficulty)
	if err != nil {
		return nil, fmt.Errorf("failed to get problem for difficulty %s: %w", difficulty, err)
	}
	match := &model.Match{PlayerAID: player1ID, PlayerBID: &player2ID, ProblemID: problem.ID, Status: model.MatchStatusPlaying, Mode: matchMode}
	if err := s.matches.CreateExclusive(match); err != nil {
		if errors.Is(err, repository.ErrActiveMatchExists) {
			return nil, apperr.New(apperr.CodeConflict, "A player already has an active match")
		}
		return nil, fmt.Errorf("failed to create match: %w", err)
	}
	created, err := s.matches.FindByID(match.ID)
	if err != nil {
		_ = s.matches.Delete(match.ID)
		return nil, fmt.Errorf("failed to load match: %w", err)
	}
	if err := s.state.CreateMatch(match.ID, player1ID, player2ID, problem.ID, difficulty, mode); err != nil {
		_ = s.matches.Delete(match.ID)
		return nil, fmt.Errorf("failed to initialize match data: %w", err)
	}
	for _, userID := range []uuid.UUID{player1ID, player2ID} {
		if err := s.reconnections.Disconnected(ctx, match.ID, userID); err != nil {
			s.logger.Warn().Err(err).Str("userID", userID.String()).Msg("Failed to schedule initial game connection deadline")
		}
	}
	if s.events != nil {
		s.events.Publish(events.TopicMatchCreated, &events.MatchCreatedEvent{Match: created})
	}
	return created, nil
}

func (s *matchLifecycleService) CreateSingle(ctx context.Context, playerID uuid.UUID, difficulty string) (*model.Match, error) {
	if !model.Difficulty(difficulty).IsValid() {
		return nil, apperr.New(apperr.CodeBadRequest, "Invalid difficulty")
	}
	problem, err := s.RandomProblem(difficulty)
	if err != nil {
		return nil, fmt.Errorf("failed to get problem for difficulty %s: %w", difficulty, err)
	}
	match := &model.Match{PlayerAID: playerID, ProblemID: problem.ID, Status: model.MatchStatusPlaying, Mode: model.MatchModeSingle}
	if err := s.matches.CreateExclusive(match); err != nil {
		if errors.Is(err, repository.ErrActiveMatchExists) {
			return nil, apperr.New(apperr.CodeConflict, "You already have an active match")
		}
		return nil, fmt.Errorf("failed to create single player match: %w", err)
	}
	created, err := s.matches.FindByID(match.ID)
	if err != nil {
		_ = s.matches.Delete(match.ID)
		return nil, fmt.Errorf("failed to load single player match: %w", err)
	}
	if err := s.state.CreateSinglePlayerMatch(match.ID, playerID, problem.ID, difficulty); err != nil {
		_ = s.matches.Delete(match.ID)
		return nil, fmt.Errorf("failed to initialize single player match data: %w", err)
	}
	if err := s.reconnections.Disconnected(ctx, match.ID, playerID); err != nil {
		s.logger.Warn().Err(err).Msg("Failed to schedule initial single-player connection deadline")
	}
	if s.events != nil {
		s.events.Publish(events.TopicMatchCreated, &events.MatchCreatedEvent{Match: created})
	}
	return created, nil
}

func (s *matchLifecycleService) Close(ctx context.Context, matchID, userID uuid.UUID) error {
	match, err := s.matches.FindByID(matchID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return apperr.Wrap(err, apperr.CodeNotFound, "Match not found")
		}
		return apperr.Wrap(err, apperr.CodeInternal, "Failed to load match")
	}
	if !isMatchParticipant(match, userID) {
		return apperr.New(apperr.CodeForbidden, "You are not a participant in this match")
	}
	if match.Status != model.MatchStatusPlaying && match.Status != model.MatchStatusWaiting {
		return nil
	}
	if match.Mode == model.MatchModeSingle {
		if err := s.matches.CloseMatch(matchID, userID); err != nil {
			return err
		}
	} else {
		finished, err := s.matches.FinishDraw(matchID)
		if err != nil {
			return err
		}
		if finished && s.events != nil {
			s.events.Publish(events.TopicGameFinished, &events.GameFinishedEvent{MatchID: matchID.String()})
		}
	}
	s.reconnections.ClearMatch(ctx, matchID)
	if err := s.state.CleanupMatch(matchID); err != nil {
		s.logger.Error().Err(err).Msg("Failed to cleanup match")
	}
	if s.redis != nil {
		_ = s.redis.Del(ctx, fmt.Sprintf("match:%s:winner_lock", matchID)).Err()
	}
	return nil
}

func (s *matchLifecycleService) Get(matchID uuid.UUID) (*model.Match, error) {
	match, err := s.matches.FindByID(matchID)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, apperr.Wrap(err, apperr.CodeNotFound, "Match not found")
	}
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "Failed to load match")
	}
	return match, nil
}

func (s *matchLifecycleService) GetActive(userID uuid.UUID) (*model.Match, error) {
	match, err := s.matches.FindActiveByUserID(userID)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "Failed to load active match")
	}
	return match, nil
}

func (s *matchLifecycleService) RandomProblem(difficulty string) (*model.Problem, error) {
	problems, err := s.problems.FindByDifficulty(difficulty)
	if err != nil {
		return nil, fmt.Errorf("failed to find problems for difficulty %s: %w", difficulty, err)
	}
	if len(problems) == 0 {
		return nil, fmt.Errorf("no problems found for difficulty %s", difficulty)
	}
	index, err := rand.Int(rand.Reader, big.NewInt(int64(len(problems))))
	if err != nil {
		index = big.NewInt(time.Now().UnixNano() % int64(len(problems)))
	}
	return &problems[index.Int64()], nil
}
