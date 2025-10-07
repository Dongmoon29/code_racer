package service

import (
	"context"
	"errors"
	"fmt"
	"math"
	"time"

	"github.com/Dongmoon29/code_racer/internal/interfaces"
	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/Dongmoon29/code_racer/internal/repository"
	"github.com/go-redis/redis/v8"
	"github.com/google/uuid"
)

type MatchService interface {
	SubmitSolution(gameID uuid.UUID, userID uuid.UUID, req *model.SubmitSolutionRequest) (*model.SubmitSolutionResponse, error)
	UpdateCode(gameID uuid.UUID, userID uuid.UUID, code string) error
	GetPlayerCode(gameID uuid.UUID, userID uuid.UUID) (string, error)

	// Matchmaking methods
	GetRandomLeetCodeByDifficulty(difficulty string) (*model.LeetCode, error)
	CreateMatch(player1ID, player2ID uuid.UUID, difficulty string, mode string) (*model.Match, error)
	CreateSinglePlayerMatch(playerID uuid.UUID, difficulty string) (*model.Match, error)

	// Query methods
	GetMatch(matchID uuid.UUID) (*model.Match, error)
}
type matchService struct {
	matchRepo    repository.MatchRepository
	leetCodeRepo repository.LeetCodeRepository
	rdb          *redis.Client
	redisManager *RedisManager
	logger       logger.Logger
	judgeService interfaces.JudgeService
	userRepo     interfaces.UserRepository
}

// NewMatchService creates a new MatchService instance with the provided dependencies
func NewMatchService(
	matchRepo repository.MatchRepository,
	leetCodeRepo repository.LeetCodeRepository,
	rdb *redis.Client,
	judgeService interfaces.JudgeService,
	userRepo interfaces.UserRepository,
	logger logger.Logger,
) MatchService {
	return &matchService{
		matchRepo:    matchRepo,
		leetCodeRepo: leetCodeRepo,
		rdb:          rdb,
		redisManager: NewRedisManager(rdb, logger),
		judgeService: judgeService,
		userRepo:     userRepo,
		logger:       logger,
	}
}

// SubmitSolution handles code submission and evaluation
func (s *matchService) SubmitSolution(matchID uuid.UUID, userID uuid.UUID, req *model.SubmitSolutionRequest) (*model.SubmitSolutionResponse, error) {
	s.logger.Debug().
		Str("matchID", matchID.String()).
		Str("userID", userID.String()).
		Msg("Starting solution submission")

		// Fetch match from repository
	match, err := s.matchRepo.FindByID(matchID)
	if err != nil {
		s.logger.Error().Err(err).Msg("Failed to find game")
		return nil, err
	}

	// Validate match status
	if match.Status != model.MatchStatusPlaying {
		s.logger.Error().
			Str("status", string(match.Status)).
			Msg("Match is not in playing status")
		return nil, errors.New("match is not in playing status")
	}

	s.logger.Debug().
		Str("code", req.Code).
		Str("language", req.Language).
		Msg("Evaluating submitted code")

		// Evaluate code via Judge service (Judge0)
	result, err := s.judgeService.EvaluateCode(req.Code, req.Language, &match.LeetCode)
	if err != nil {
		s.logger.Error().Err(err).Msg("Code evaluation failed")
		return nil, err
	}

	s.logger.Debug().
		Bool("passed", result.Passed).
		Float64("executionTime", result.ExecutionTime).
		Float64("memoryUsage", result.MemoryUsage).
		Int("testCaseCount", len(result.TestResults)).
		Str("errorMessage", result.ErrorMessage).
		Msg("Code evaluation completed")

		// Check if all test cases passed
	if result.Passed {
		s.logger.Debug().Msg("All test cases passed, setting winner")

		// Set winner using a distributed lock (prevent race on simultaneous submits)
		ctx := context.Background()
		lockKey := fmt.Sprintf("match:%s:winner_lock", matchID.String())
		lockValue := userID.String()
		lockExpiry := 10 * time.Second

		// Try to acquire the distributed lock
		lockAcquired, err := s.rdb.SetNX(ctx, lockKey, lockValue, lockExpiry).Result()
		if err != nil {
			s.logger.Error().Err(err).Msg("Failed to acquire winner lock")
			return nil, err
		}

		if !lockAcquired {
			// Another player already won
			s.logger.Info().Msg("Another player already won the game")
			return &model.SubmitSolutionResponse{
				Success:  true,
				Message:  "Your solution passed all test cases, but another player won first",
				IsWinner: false,
			}, nil
		}

		// Ensure lock is released (defer)
		defer func() {
			s.rdb.Del(ctx, lockKey)
		}()

		// Persist winner in DB
		if err := s.matchRepo.SetWinner(matchID, userID); err != nil {
			s.logger.Error().Err(err).Msg("Failed to set winner")
			return nil, err
		}

		// Update match status in Redis
		matchKey := fmt.Sprintf("match:%s", matchID.String())
		if err := s.rdb.HSet(ctx, matchKey, "status", string(model.MatchStatusFinished)).Err(); err != nil {
			s.logger.Error().Err(err).Msg("Failed to update match status in Redis")
		}

		// ELO update for ranked matches
		// Reload match to ensure we have the latest mode and participants
		updatedMatch, err := s.matchRepo.FindByID(matchID)
		if err == nil && updatedMatch != nil && updatedMatch.Mode == model.MatchModeRankedPVP && updatedMatch.PlayerBID != nil {
			winnerID := userID
			var loserID uuid.UUID
			if winnerID == updatedMatch.PlayerAID {
				loserID = *updatedMatch.PlayerBID
			} else {
				loserID = updatedMatch.PlayerAID
			}

			// Fetch users
			winner, err1 := s.userRepo.FindByID(winnerID)
			loser, err2 := s.userRepo.FindByID(loserID)
			if err1 == nil && err2 == nil && winner != nil && loser != nil {
				newWinner, newLoser := applyElo(winner.Rating, loser.Rating, true)
				winner.Rating = newWinner
				loser.Rating = newLoser
				if err := s.userRepo.Update(winner); err != nil {
					s.logger.Error().Err(err).Msg("Failed to update winner rating")
				}
				if err := s.userRepo.Update(loser); err != nil {
					s.logger.Error().Err(err).Msg("Failed to update loser rating")
				}
			} else {
				s.logger.Warn().Msg("Failed to load users for ELO update")
			}
		}

		// Game end notification will be handled by WebSocket layer
		s.logger.Info().Msg("Match completed - winner determined")

		return &model.SubmitSolutionResponse{
			Success:  true,
			Message:  "Your solution passed all test cases",
			IsWinner: true,
		}, nil
	}

	s.logger.Debug().Msg("Solution failed some test cases")
	return &model.SubmitSolutionResponse{
		Success:  false,
		Message:  fmt.Sprintf("Your solution failed: %s", result.ErrorMessage),
		IsWinner: false,
	}, nil
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
	match, err := s.matchRepo.FindByID(matchID)
	if err != nil {
		return nil, err
	}
	return match, nil
}

// CreateMatch persists a new match and initializes Redis state
func (s *matchService) CreateMatch(player1ID, player2ID uuid.UUID, difficulty string, mode string) (*model.Match, error) {
	// Pick a random LeetCode problem for the requested difficulty
	leetcode, err := s.GetRandomLeetCodeByDifficulty(difficulty)
	if err != nil {
		s.logger.Error().Err(err).Str("difficulty", difficulty).Msg("Failed to get random LeetCode problem")
		return nil, fmt.Errorf("failed to get problem for difficulty %s: %w", difficulty, err)
	}

	match := &model.Match{
		PlayerAID:  player1ID,
		PlayerBID:  &player2ID,
		LeetCodeID: leetcode.ID,
		Status:     model.MatchStatusPlaying,
		Mode:       model.MatchMode(mode),
	}

	// Save to database
	if err := s.matchRepo.Create(match); err != nil {
		s.logger.Error().Err(err).Msg("Failed to create match in database")
		return nil, fmt.Errorf("failed to create match: %w", err)
	}

	// Load the complete match with associated LeetCode details
	createdMatch, err := s.matchRepo.FindByID(match.ID)
	if err != nil {
		s.logger.Error().Err(err).Msg("Failed to load created match")
		return nil, fmt.Errorf("failed to load match: %w", err)
	}

	// Initialize Redis data using RedisManager
	if err := s.redisManager.CreateMatch(match.ID, player1ID, player2ID, leetcode.ID, difficulty, mode); err != nil {
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
		Str("problem", leetcode.Title).
		Msg("Successfully created match")

	return createdMatch, nil
}

// CreateSinglePlayerMatch creates a single player match for practice mode
func (s *matchService) CreateSinglePlayerMatch(playerID uuid.UUID, difficulty string) (*model.Match, error) {
	// Pick a random LeetCode problem for the requested difficulty
	leetcode, err := s.GetRandomLeetCodeByDifficulty(difficulty)
	if err != nil {
		s.logger.Error().Err(err).Str("difficulty", difficulty).Msg("Failed to get random LeetCode problem")
		return nil, fmt.Errorf("failed to get problem for difficulty %s: %w", difficulty, err)
	}

	match := &model.Match{
		PlayerAID:  playerID,
		PlayerBID:  nil, // No second player for single mode
		LeetCodeID: leetcode.ID,
		Status:     model.MatchStatusPlaying,
		Mode:       model.MatchModeSingle,
	}

	// Save to database
	if err := s.matchRepo.Create(match); err != nil {
		s.logger.Error().Err(err).Msg("Failed to create single player match in database")
		return nil, fmt.Errorf("failed to create single player match: %w", err)
	}

	// Load the complete match with associated LeetCode details
	createdMatch, err := s.matchRepo.FindByID(match.ID)
	if err != nil {
		s.logger.Error().Err(err).Msg("Failed to load created single player match")
		return nil, fmt.Errorf("failed to load single player match: %w", err)
	}

	// Initialize Redis data for single player match
	if err := s.redisManager.CreateSinglePlayerMatch(match.ID, playerID, leetcode.ID, difficulty); err != nil {
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
		Str("problem", leetcode.Title).
		Msg("Successfully created single player match")

	return createdMatch, nil
}

// GetRandomLeetCodeByDifficulty gets a random LeetCode problem by difficulty
func (s *matchService) GetRandomLeetCodeByDifficulty(difficulty string) (*model.LeetCode, error) {
	problems, err := s.leetCodeRepo.FindByDifficulty(difficulty)
	if err != nil {
		return nil, fmt.Errorf("failed to find problems for difficulty %s: %w", difficulty, err)
	}

	if len(problems) == 0 {
		return nil, fmt.Errorf("no problems found for difficulty %s", difficulty)
	}

	// Select a random problem
	randomIndex := time.Now().UnixNano() % int64(len(problems))
	selectedProblem := &problems[randomIndex]

	s.logger.Debug().
		Str("difficulty", difficulty).
		Str("selectedProblem", selectedProblem.Title).
		Int("totalProblems", len(problems)).
		Msg("Selected random LeetCode problem")

	return selectedProblem, nil
}
