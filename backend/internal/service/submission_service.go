package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/Dongmoon29/code_racer/internal/apperr"
	"github.com/Dongmoon29/code_racer/internal/constants"
	"github.com/Dongmoon29/code_racer/internal/events"
	"github.com/Dongmoon29/code_racer/internal/game"
	"github.com/Dongmoon29/code_racer/internal/interfaces"
	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/Dongmoon29/code_racer/internal/repository"
	"github.com/Dongmoon29/code_racer/internal/types"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

const maxSubmissionCodeBytes = 100_000

var releaseOwnedLock = redis.NewScript(`
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("DEL", KEYS[1])
end
return 0
`)

// submissionService owns validation, judging, and winner determination.
type submissionService struct {
	matches     repository.MatchRepository
	judge       interfaces.JudgeService
	redis       *redis.Client
	state       *RedisManager
	ratings     *ratingService
	logger      logger.Logger
	events      events.EventBus
	broadcaster interfaces.WebSocketBroadcaster
}

func newSubmissionService(matches repository.MatchRepository, judge interfaces.JudgeService, redisClient *redis.Client, state *RedisManager, ratings *ratingService, appLogger logger.Logger, eventBus events.EventBus, broadcaster interfaces.WebSocketBroadcaster) *submissionService {
	return &submissionService{matches: matches, judge: judge, redis: redisClient, state: state, ratings: ratings, logger: appLogger, events: eventBus, broadcaster: broadcaster}
}

func (s *submissionService) Submit(ctx context.Context, cmd game.SubmitCommand) (*game.SubmissionResult, error) {
	match, err := s.fetchMatch(cmd.MatchID)
	if err != nil {
		return nil, err
	}
	if err := validateSubmissionRequest(match, cmd.UserID, cmd.Code, cmd.Language); err != nil {
		return nil, err
	}

	result, err := s.evaluate(cmd, match)
	if err != nil {
		return nil, err
	}
	if !result.Passed {
		return failureSubmissionResponse(result), nil
	}
	return s.finishWinner(ctx, cmd.MatchID, cmd.UserID, cmd.Code, cmd.Language, result)
}

func validateSubmissionRequest(match *model.Match, userID uuid.UUID, code, language string) error {
	if match == nil {
		return apperr.New(apperr.CodeBadRequest, "Invalid submission")
	}
	if !isMatchParticipant(match, userID) {
		return apperr.New(apperr.CodeForbidden, "You are not a participant in this match")
	}
	if len(code) > maxSubmissionCodeBytes {
		return apperr.New(apperr.CodeBadRequest, "Submitted code is too large")
	}
	switch strings.ToLower(strings.TrimSpace(language)) {
	case "javascript", "python", "go":
		return nil
	default:
		return apperr.New(apperr.CodeBadRequest, "Unsupported programming language")
	}
}

func (s *submissionService) fetchMatch(matchID uuid.UUID) (*model.Match, error) {
	match, err := s.matches.FindPlayingMatchByID(matchID)
	if err == nil {
		return match, nil
	}
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, apperr.Wrap(err, apperr.CodeNotFound, "Match not found")
	}
	return nil, apperr.Wrap(err, apperr.CodeInternal, "Failed to load match")
}

func (s *submissionService) evaluate(cmd game.SubmitCommand, match *model.Match) (*types.EvaluationResult, error) {
	result, err := s.judge.EvaluateCodeWithRealtime(cmd.Code, cmd.Language, &match.Problem, cmd.MatchID, cmd.UserID)
	if err == nil {
		return result, nil
	}
	if strings.Contains(err.Error(), "exceeded the DAILY quota") {
		return nil, apperr.New(apperr.CodeQuotaExceeded, "Code evaluation service quota exceeded. Please try again later.")
	}
	return nil, apperr.Wrap(err, apperr.CodeUpstreamUnavailable, "Code evaluation failed")
}

func (s *submissionService) finishWinner(ctx context.Context, matchID, userID uuid.UUID, code, language string, result *types.EvaluationResult) (*game.SubmissionResult, error) {
	lockKey := fmt.Sprintf("match:%s:winner_lock", matchID)
	lockValue := userID.String() + ":" + uuid.NewString()
	locked, err := s.redis.SetNX(ctx, lockKey, lockValue, 10*time.Second).Result()
	if err != nil {
		return nil, err
	}
	if !locked {
		return secondPlaceSubmissionResponse(), nil
	}
	defer func() {
		if err := releaseOwnedLock.Run(context.Background(), s.redis, []string{lockKey}, lockValue).Err(); err != nil && !errors.Is(err, redis.Nil) {
			s.logger.Warn().Err(err).Msg("Failed to release winner lock")
		}
	}()

	err = s.matches.SetWinner(matchID, userID, code, language, result.ExecutionTime, result.MemoryUsage)
	if errors.Is(err, repository.ErrMatchNotPlaying) {
		return secondPlaceSubmissionResponse(), nil
	}
	if err != nil {
		return nil, err
	}

	if err := s.state.UpdateMatchStatusContext(ctx, matchID, model.MatchStatusFinished); err != nil {
		s.logger.Error().Err(err).Msg("Failed to update match status in Redis")
	}
	s.ratings.UpdateForWinner(matchID, userID)
	s.notifyFinished(matchID, userID)
	return successfulSubmissionResponse(), nil
}

func (s *submissionService) UpdateCode(matchID, userID uuid.UUID, code, language string) error {
	match, err := s.matches.FindByID(matchID)
	if err != nil {
		return err
	}
	if match.Status != model.MatchStatusPlaying {
		return repository.ErrMatchNotPlaying
	}
	if !isMatchParticipant(match, userID) {
		return apperr.New(apperr.CodeForbidden, "You are not a participant in this match")
	}
	if code != "" {
		if err := s.state.UpdateUserCode(matchID, userID, code); err != nil {
			return err
		}
	}
	if language != "" {
		return s.state.UpdateUserLanguage(matchID, userID, language)
	}
	return nil
}

func (s *submissionService) GetPlayerCode(matchID, userID uuid.UUID) (string, error) {
	return s.state.GetUserCode(matchID, userID)
}

func (s *submissionService) notifyFinished(matchID, winnerID uuid.UUID) {
	if s.events != nil {
		s.events.Publish(events.TopicGameFinished, &events.GameFinishedEvent{MatchID: matchID.String(), WinnerID: winnerID.String()})
		return
	}
	if s.broadcaster == nil {
		return
	}
	message, err := json.Marshal(map[string]interface{}{
		"type": constants.GameFinished, "game_id": matchID.String(), "winner_id": winnerID.String(),
	})
	if err == nil {
		s.broadcaster.BroadcastToMatch(matchID, message)
	}
}

func successfulSubmissionResponse() *game.SubmissionResult {
	return &game.SubmissionResult{Success: true, Message: "Your solution passed all test cases", IsWinner: true}
}

func secondPlaceSubmissionResponse() *game.SubmissionResult {
	return &game.SubmissionResult{Success: true, Message: "Your solution passed all test cases, but another player won first", IsWinner: false}
}

func failureSubmissionResponse(result *types.EvaluationResult) *game.SubmissionResult {
	return &game.SubmissionResult{Success: false, Message: fmt.Sprintf("Your solution failed: %s", result.ErrorMessage), IsWinner: false}
}
