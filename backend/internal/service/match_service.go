package service

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"math/big"
	"strings"
	"time"

	"github.com/Dongmoon29/code_racer/internal/apperr"
	"github.com/Dongmoon29/code_racer/internal/constants"
	"github.com/Dongmoon29/code_racer/internal/events"
	"github.com/Dongmoon29/code_racer/internal/interfaces"
	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/Dongmoon29/code_racer/internal/repository"
	"github.com/Dongmoon29/code_racer/internal/types"
	"github.com/go-redis/redis/v8"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type MatchService interface {
	SubmitSolution(gameID uuid.UUID, userID uuid.UUID, req *model.SubmitSolutionRequest) (*model.SubmitSolutionResponse, error)
	UpdateCode(gameID uuid.UUID, userID uuid.UUID, code string) error
	GetPlayerCode(gameID uuid.UUID, userID uuid.UUID) (string, error)

	// Matchmaking methods
	GetRandomProblemByDifficulty(difficulty string) (*model.Problem, error)
	CreateMatch(player1ID, player2ID uuid.UUID, difficulty string, mode string) (*model.Match, error)
	CreateSinglePlayerMatch(playerID uuid.UUID, difficulty string) (*model.Match, error)

	// Query methods
	GetMatch(matchID uuid.UUID) (*model.Match, error)
}
type matchService struct {
	matchRepo     repository.MatchRepository
	problemRepo   repository.ProblemRepository
	rdb           *redis.Client
	redisManager  *RedisManager
	logger        logger.Logger
	judgeService  interfaces.JudgeService
	userRepo      interfaces.UserRepository
	wsBroadcaster interfaces.WebSocketBroadcaster
	eventBus      events.EventBus
}

// NewMatchService creates a new MatchService instance with the provided dependencies
func NewMatchService(
	matchRepo repository.MatchRepository,
	problemRepo repository.ProblemRepository,
	rdb *redis.Client,
	judgeService interfaces.JudgeService,
	userRepo interfaces.UserRepository,
	logger logger.Logger,
	wsBroadcaster interfaces.WebSocketBroadcaster,
	opts ...interface{},
) MatchService {
	svc := &matchService{
		matchRepo:     matchRepo,
		problemRepo:   problemRepo,
		rdb:           rdb,
		redisManager:  NewRedisManager(rdb, logger),
		judgeService:  judgeService,
		userRepo:      userRepo,
		logger:        logger,
		wsBroadcaster: wsBroadcaster,
	}

	if len(opts) > 0 {
		if bus, ok := opts[0].(events.EventBus); ok {
			svc.eventBus = bus
		}
	}
	return svc
}

// SubmitSolution handles code submission and evaluation
func (s *matchService) SubmitSolution(matchID uuid.UUID, userID uuid.UUID, req *model.SubmitSolutionRequest) (*model.SubmitSolutionResponse, error) {
	s.logger.Debug().
		Str("matchID", matchID.String()).
		Str("userID", userID.String()).
		Msg("Starting solution submission")

	match, err := s.fetchMatch(matchID)
	if err != nil {
		return nil, err
	}

	result, err := s.evaluateCode(req, match, matchID, userID)
	if err != nil {
		return nil, err
	}

	if result.Passed {
		return s.handleWinner(matchID, userID, result)
	}

	return s.createFailureResponse(result), nil
}

// fetchMatch retrieves the match from repository
func (s *matchService) fetchMatch(matchID uuid.UUID) (*model.Match, error) {
	match, err := s.matchRepo.FindPlayingMatchByID(matchID)
	if err != nil {
		s.logger.Error().Err(err).Msg("Failed to find playing match")
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperr.Wrap(err, apperr.CodeNotFound, "Match not found")
		}
		return nil, apperr.Wrap(err, apperr.CodeInternal, "Failed to load match")
	}
	return match, nil
}

// evaluateCode evaluates the submitted code via Judge service
func (s *matchService) evaluateCode(req *model.SubmitSolutionRequest, match *model.Match, matchID uuid.UUID, userID uuid.UUID) (*types.EvaluationResult, error) {
	s.logger.Debug().
		Str("code", req.Code).
		Str("language", req.Language).
		Msg("Evaluating submitted code")

	result, err := s.judgeService.EvaluateCodeWithRealtime(req.Code, req.Language, &match.Problem, matchID, userID)
	if err != nil {
		s.logger.Error().Err(err).Msg("Code evaluation failed")
		if strings.Contains(err.Error(), "exceeded the DAILY quota") {
			return nil, apperr.New(apperr.CodeQuotaExceeded, "Code evaluation service quota exceeded. Please try again later.")
		}
		return nil, apperr.Wrap(err, apperr.CodeUpstreamUnavailable, "Code evaluation failed")
	}

	s.logger.Debug().
		Bool("passed", result.Passed).
		Float64("executionTime", result.ExecutionTime).
		Float64("memoryUsage", result.MemoryUsage).
		Int("testCaseCount", len(result.TestResults)).
		Str("errorMessage", result.ErrorMessage).
		Msg("Code evaluation completed")

	return result, nil
}

// handleWinner processes winner determination with distributed locking
func (s *matchService) handleWinner(matchID uuid.UUID, userID uuid.UUID, result *types.EvaluationResult) (*model.SubmitSolutionResponse, error) {
	s.logger.Debug().Msg("All test cases passed, setting winner")

	ctx := context.Background()
	lockKey := fmt.Sprintf("match:%s:winner_lock", matchID.String())
	lockValue := userID.String()
	lockExpiry := 10 * time.Second

	lockAcquired, err := s.acquireWinnerLock(ctx, lockKey, lockValue, lockExpiry)
	if err != nil {
		return nil, err
	}

	if !lockAcquired {
		return s.createSecondPlaceResponse(), nil
	}

	defer s.releaseWinnerLock(ctx, lockKey)

	if err := s.persistWinner(matchID, userID, result); err != nil {
		return nil, err
	}

	s.updateMatchStatusInRedis(ctx, matchID)
	s.updateEloRatings(matchID, userID)
	s.sendGameFinishedNotification(matchID, userID)

	s.logger.Info().Msg("Match completed - winner determined")
	return s.createSuccessResponse(), nil
}

// acquireWinnerLock attempts to acquire distributed lock for winner determination
func (s *matchService) acquireWinnerLock(ctx context.Context, lockKey, lockValue string, lockExpiry time.Duration) (bool, error) {
	lockAcquired, err := s.rdb.SetNX(ctx, lockKey, lockValue, lockExpiry).Result()
	if err != nil {
		s.logger.Error().Err(err).Msg("Failed to acquire winner lock")
		return false, err
	}
	return lockAcquired, nil
}

// releaseWinnerLock releases the distributed lock
func (s *matchService) releaseWinnerLock(ctx context.Context, lockKey string) {
	s.rdb.Del(ctx, lockKey)
}

// persistWinner saves winner information to database
func (s *matchService) persistWinner(matchID uuid.UUID, userID uuid.UUID, result *types.EvaluationResult) error {
	if err := s.matchRepo.SetWinner(matchID, userID, result.ExecutionTime, result.MemoryUsage); err != nil {
		s.logger.Error().Err(err).Msg("Failed to set winner")
		return err
	}
	return nil
}

// updateMatchStatusInRedis updates match status to finished in Redis
func (s *matchService) updateMatchStatusInRedis(ctx context.Context, matchID uuid.UUID) {
	matchKey := fmt.Sprintf("match:%s", matchID.String())
	if err := s.rdb.HSet(ctx, matchKey, "status", string(model.MatchStatusFinished)).Err(); err != nil {
		s.logger.Error().Err(err).Msg("Failed to update match status in Redis")
	}
}

// updateEloRatings updates ELO ratings for ranked matches
func (s *matchService) updateEloRatings(matchID uuid.UUID, userID uuid.UUID) {
	updatedMatch, err := s.matchRepo.FindByID(matchID)
	if err != nil || updatedMatch == nil || updatedMatch.Mode != model.MatchModeRankedPVP || updatedMatch.PlayerBID == nil {
		return
	}

	winnerID, loserID := s.determineWinnerAndLoser(updatedMatch, userID)
	if err := s.applyEloUpdate(updatedMatch, winnerID, loserID); err != nil {
		s.logger.Warn().Err(err).Msg("Failed to update ELO ratings")
	}
}

// determineWinnerAndLoser determines winner and loser IDs from match
func (s *matchService) determineWinnerAndLoser(match *model.Match, userID uuid.UUID) (uuid.UUID, uuid.UUID) {
	winnerID := userID
	var loserID uuid.UUID
	if winnerID == match.PlayerAID {
		loserID = *match.PlayerBID
	} else {
		loserID = match.PlayerAID
	}
	return winnerID, loserID
}

// applyEloUpdate applies ELO rating updates to winner and loser
func (s *matchService) applyEloUpdate(match *model.Match, winnerID, loserID uuid.UUID) error {
	winner, err1 := s.userRepo.FindByID(winnerID)
	loser, err2 := s.userRepo.FindByID(loserID)
	if err1 != nil || err2 != nil || winner == nil || loser == nil {
		return fmt.Errorf("failed to load users for ELO update")
	}

	winnerOld := winner.Rating
	loserOld := loser.Rating
	newWinner, newLoser := applyElo(winnerOld, loserOld, true)

	winner.Rating = newWinner
	loser.Rating = newLoser

	if err := s.userRepo.Update(winner); err != nil {
		return fmt.Errorf("failed to update winner rating: %w", err)
	}
	if err := s.userRepo.Update(loser); err != nil {
		return fmt.Errorf("failed to update loser rating: %w", err)
	}

	match.WinnerRatingDelta = newWinner - winnerOld
	match.LoserRatingDelta = newLoser - loserOld
	if err := s.matchRepo.Update(match); err != nil {
		return fmt.Errorf("failed to update match rating deltas: %w", err)
	}

	return nil
}

// createSuccessResponse creates success response for winner
func (s *matchService) createSuccessResponse() *model.SubmitSolutionResponse {
	return &model.SubmitSolutionResponse{
		Success:  true,
		Message:  "Your solution passed all test cases",
		IsWinner: true,
	}
}

// createSecondPlaceResponse creates response for second place
func (s *matchService) createSecondPlaceResponse() *model.SubmitSolutionResponse {
	s.logger.Info().Msg("Another player already won the game")
	return &model.SubmitSolutionResponse{
		Success:  true,
		Message:  "Your solution passed all test cases, but another player won first",
		IsWinner: false,
	}
}

// createFailureResponse creates failure response
func (s *matchService) createFailureResponse(result *types.EvaluationResult) *model.SubmitSolutionResponse {
	s.logger.Debug().Msg("Solution failed some test cases")
	return &model.SubmitSolutionResponse{
		Success:  false,
		Message:  fmt.Sprintf("Your solution failed: %s", result.ErrorMessage),
		IsWinner: false,
	}
}

// applyElo applies ELO update with K-factor to winner/loser ratings.
// Returns updated ratings (winnerNew, loserNew).
func applyElo(winnerRating int, loserRating int, winnerWon bool) (int, int) {
	const kFactor = 32.0
	ra := float64(winnerRating)
	rb := float64(loserRating)
	ea := 1.0 / (1.0 + math.Pow(10.0, (rb-ra)/400.0))
	eb := 1.0 - ea
	var sa, sb float64
	if winnerWon {
		sa, sb = 1.0, 0.0
	} else {
		sa, sb = 0.0, 1.0
	}
	newRA := int(math.Round(ra + kFactor*(sa-ea)))
	newRB := int(math.Round(rb + kFactor*(sb-eb)))
	if newRA < 0 {
		newRA = 0
	}
	if newRB < 0 {
		newRB = 0
	}
	return newRA, newRB
}

// UpdateCode stores user's code in Redis and will be broadcasted by WebSocket layer
func (s *matchService) UpdateCode(matchID uuid.UUID, userID uuid.UUID, code string) error {
	match, err := s.matchRepo.FindByID(matchID)
	if err != nil {
		return err
	}

	// Validate match status
	if match.Status != model.MatchStatusPlaying {
		return errors.New("match is not in playing status")
	}

	// Persist code in Redis
	if err := s.redisManager.UpdateUserCode(matchID, userID, code); err != nil {
		return err
	}

	return nil
}

// GetPlayerCode returns the user's code snapshot stored in Redis
func (s *matchService) GetPlayerCode(matchID uuid.UUID, userID uuid.UUID) (string, error) {
	return s.redisManager.GetUserCode(matchID, userID)
}

func (s *matchService) CloseMatch(matchID uuid.UUID, userID uuid.UUID) error {
	// Close match in DB
	if err := s.matchRepo.CloseMatch(matchID, userID); err != nil {
		return err
	}

	// Cleanup match data in Redis
	ctx := context.Background()

	// Get participants in the match
	users, err := s.redisManager.GetMatchUsers(matchID)
	if err != nil {
		s.logger.Error().Err(err).Msg("Failed to get match users from Redis")
	}

	// Remove each user from the match
	for _, uid := range users {
		userID, err := uuid.Parse(uid)
		if err != nil {
			s.logger.Error().Err(err).Str("userID", uid).Msg("Failed to parse user ID")
			continue
		}
		if err := s.redisManager.RemoveUserFromMatch(matchID, userID); err != nil {
			s.logger.Error().Err(err).Str("userID", uid).Msg("Failed to remove user from match")
		}
	}

	// Cleanup all remaining match keys
	if err := s.redisManager.CleanupMatch(matchID); err != nil {
		s.logger.Error().Err(err).Msg("Failed to cleanup match")
	}

	// Cleanup winner lock key as well
	lockKey := fmt.Sprintf("match:%s:winner_lock", matchID.String())
	s.rdb.Del(ctx, lockKey)

	return nil
}

// GetMatch finds a match by ID
func (s *matchService) GetMatch(matchID uuid.UUID) (*model.Match, error) {
	s.logger.Debug().Str("matchID", matchID.String()).Msg("Getting match by ID")

	match, err := s.matchRepo.FindByID(matchID)
	if err != nil {
		s.logger.Error().Err(err).Str("matchID", matchID.String()).Msg("Failed to get match by ID")
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperr.Wrap(err, apperr.CodeNotFound, "Match not found")
		}
		return nil, apperr.Wrap(err, apperr.CodeInternal, "Failed to load match")
	}

	// Log match data as JSON for easy debugging
	if match != nil {
		if jsonData, err := json.MarshalIndent(match, "", "  "); err != nil {
			s.logger.Error().Err(err).Msg("Failed to marshal match data to JSON")
		} else {
			s.logger.Debug().RawJSON("match", jsonData).Msg("Match data loaded successfully")
		}
	} else {
		s.logger.Warn().Str("matchID", matchID.String()).Msg("Match is nil")
	}

	return match, nil
}

// CreateMatch persists a new match and initializes Redis state
func (s *matchService) CreateMatch(player1ID, player2ID uuid.UUID, difficulty string, mode string) (*model.Match, error) {
	problem, err := s.GetRandomProblemByDifficulty(difficulty)
	if err != nil {
		s.logger.Error().Err(err).Str("difficulty", difficulty).Msg("Failed to get random problem")
		return nil, fmt.Errorf("failed to get problem for difficulty %s: %w", difficulty, err)
	}

	match := &model.Match{
		PlayerAID: player1ID,
		PlayerBID: &player2ID,
		ProblemID: problem.ID,
		Status:    model.MatchStatusPlaying,
		Mode:      model.MatchMode(mode),
	}

	// Save to database
	if err := s.matchRepo.Create(match); err != nil {
		s.logger.Error().Err(err).Msg("Failed to create match in database")
		return nil, fmt.Errorf("failed to create match: %w", err)
	}

	// Load the complete match with associated Problem details
	createdMatch, err := s.matchRepo.FindByID(match.ID)
	if err != nil {
		s.logger.Error().Err(err).Msg("Failed to load created match")
		return nil, fmt.Errorf("failed to load match: %w", err)
	}

	// Initialize Redis data using RedisManager
	if err := s.redisManager.CreateMatch(match.ID, player1ID, player2ID, problem.ID, difficulty, mode); err != nil {
		s.logger.Error().Err(err).Msg("Failed to initialize Redis data for match")
		// Try to rollback the database record
		if deleteErr := s.matchRepo.Delete(match.ID); deleteErr != nil {
			s.logger.Error().Err(deleteErr).Msg("Failed to rollback match creation")
		}
		return nil, fmt.Errorf("failed to initialize match data: %w", err)
	}

	s.logger.Info().
		Str("matchID", match.ID.String()).
		Str("player1ID", player1ID.String()).
		Str("player2ID", player2ID.String()).
		Str("difficulty", difficulty).
		Str("problem", problem.Title).
		Msg("Successfully created match")

	return createdMatch, nil
}

// CreateSinglePlayerMatch creates a single player match for practice mode
func (s *matchService) CreateSinglePlayerMatch(playerID uuid.UUID, difficulty string) (*model.Match, error) {
	// Pick a random problem for the requested difficulty
	problem, err := s.GetRandomProblemByDifficulty(difficulty)
	if err != nil {
		s.logger.Error().Err(err).Str("difficulty", difficulty).Msg("Failed to get random problem")
		return nil, fmt.Errorf("failed to get problem for difficulty %s: %w", difficulty, err)
	}

	match := &model.Match{
		PlayerAID: playerID,
		PlayerBID: nil, // No second player for single mode
		ProblemID: problem.ID,
		Status:    model.MatchStatusPlaying,
		Mode:      model.MatchModeSingle,
	}

	// Save to database
	if err := s.matchRepo.Create(match); err != nil {
		s.logger.Error().Err(err).Msg("Failed to create single player match in database")
		return nil, fmt.Errorf("failed to create single player match: %w", err)
	}

	// Load the complete match with associated problem details
	createdMatch, err := s.matchRepo.FindByID(match.ID)
	if err != nil {
		s.logger.Error().Err(err).Msg("Failed to load created single player match")
		return nil, fmt.Errorf("failed to load single player match: %w", err)
	}

	// Initialize Redis data for single player match
	if err := s.redisManager.CreateSinglePlayerMatch(match.ID, playerID, problem.ID, difficulty); err != nil {
		s.logger.Error().Err(err).Msg("Failed to initialize Redis data for single player match")
		// Try to rollback the database record
		if deleteErr := s.matchRepo.Delete(match.ID); deleteErr != nil {
			s.logger.Error().Err(deleteErr).Msg("Failed to rollback single player match creation")
		}
		return nil, fmt.Errorf("failed to initialize single player match data: %w", err)
	}

	s.logger.Info().
		Str("matchID", match.ID.String()).
		Str("playerID", playerID.String()).
		Str("difficulty", difficulty).
		Str("problem", problem.Title).
		Msg("Successfully created single player match")

	return createdMatch, nil
}

// GetRandomProblemByDifficulty gets a random problem by difficulty
func (s *matchService) GetRandomProblemByDifficulty(difficulty string) (*model.Problem, error) {
	problems, err := s.problemRepo.FindByDifficulty(difficulty)
	if err != nil {
		return nil, fmt.Errorf("failed to find problems for difficulty %s: %w", difficulty, err)
	}

	if len(problems) == 0 {
		return nil, fmt.Errorf("no problems found for difficulty %s", difficulty)
	}

	// Select a random problem using crypto/rand for better distribution
	randomIndexBig, err := rand.Int(rand.Reader, big.NewInt(int64(len(problems))))
	if err != nil {
		// Fallback to time-based random if crypto/rand fails
		s.logger.Warn().Err(err).Msg("Failed to generate cryptographically secure random number, using time-based fallback")
		randomIndexBig = big.NewInt(time.Now().UnixNano() % int64(len(problems)))
	}
	randomIndex := randomIndexBig.Int64()
	selectedProblem := &problems[randomIndex]

	s.logger.Debug().
		Str("difficulty", difficulty).
		Str("selectedProblem", selectedProblem.Title).
		Int("totalProblems", len(problems)).
		Msg("Selected random problem")

	return selectedProblem, nil
}

// sendGameFinishedNotification sends a WebSocket message when the game is finished
func (s *matchService) sendGameFinishedNotification(matchID, winnerID uuid.UUID) {
	// Fetch match to check if it's a single player game
	match, err := s.matchRepo.FindByID(matchID)
	if err != nil {
		s.logger.Error().Err(err).Msg("Failed to fetch match for game finished notification")
		return
	}

	// Don't send WebSocket notification for single player games
	if match.Mode == model.MatchModeSingle {
		s.logger.Debug().
			Str("matchID", matchID.String()).
			Msg("Skipping WebSocket notification for single player game")
		if s.eventBus != nil {
			s.eventBus.Publish(events.TopicGameFinished, &events.GameFinishedEvent{MatchID: matchID.String(), WinnerID: winnerID.String()})
		}
		return
	}

	if s.wsBroadcaster == nil {
		s.logger.Warn().Msg("WebSocket broadcaster is nil, cannot send game finished notification")
		return
	}

	message := map[string]interface{}{
		"type":      constants.GameFinished,
		"game_id":   matchID.String(),
		"winner_id": winnerID.String(),
	}

	msgBytes, err := json.Marshal(message)
	if err != nil {
		s.logger.Error().Err(err).Msg("Failed to marshal game finished message")
		return
	}

	s.wsBroadcaster.BroadcastToMatch(matchID, msgBytes)
	s.logger.Info().
		Str("matchID", matchID.String()).
		Str("winnerID", winnerID.String()).
		Msg("Game finished notification sent via WebSocket")

	if s.eventBus != nil {
		s.eventBus.Publish(events.TopicGameFinished, &events.GameFinishedEvent{MatchID: matchID.String(), WinnerID: winnerID.String()})
	}
}
