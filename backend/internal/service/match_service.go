package service

import (
	"context"
	"errors"
	"fmt"
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
	CreateMatch(player1ID, player2ID uuid.UUID, difficulty string) (*model.Match, error)

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
}

// NewMatchService creates a new MatchService instance with the provided dependencies
func NewMatchService(
	matchRepo repository.MatchRepository,
	leetCodeRepo repository.LeetCodeRepository,
	rdb *redis.Client,
	judgeService interfaces.JudgeService,
	logger logger.Logger,
) MatchService {
	return &matchService{
		matchRepo:    matchRepo,
		leetCodeRepo: leetCodeRepo,
		rdb:          rdb,
		redisManager: NewRedisManager(rdb, logger),
		judgeService: judgeService,
		logger:       logger,
	}
}

// SubmitSolution 코드 제출 및 평가
func (s *matchService) SubmitSolution(matchID uuid.UUID, userID uuid.UUID, req *model.SubmitSolutionRequest) (*model.SubmitSolutionResponse, error) {
	s.logger.Debug().
		Str("matchID", matchID.String()).
		Str("userID", userID.String()).
		Msg("Starting solution submission")

	// 게임 정보 조회
	match, err := s.matchRepo.FindByID(matchID)
	if err != nil {
		s.logger.Error().Err(err).Msg("Failed to find game")
		return nil, err
	}

	// 게임 상태 체크
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

	// Judge0 API를 통해 코드 평가
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

	// 코드가 모든 테스트 케이스를 통과했는지 확인
	if result.Passed {
		s.logger.Debug().Msg("All test cases passed, setting winner")

		// 분산 락을 사용한 승자 설정 (동시 제출 방지)
		ctx := context.Background()
		lockKey := fmt.Sprintf("match:%s:winner_lock", matchID.String())
		lockValue := userID.String()
		lockExpiry := 10 * time.Second

		// 분산 락 획득 시도
		lockAcquired, err := s.rdb.SetNX(ctx, lockKey, lockValue, lockExpiry).Result()
		if err != nil {
			s.logger.Error().Err(err).Msg("Failed to acquire winner lock")
			return nil, err
		}

		if !lockAcquired {
			// 다른 플레이어가 이미 승리했음
			s.logger.Info().Msg("Another player already won the game")
			return &model.SubmitSolutionResponse{
				Success:  true,
				Message:  "Your solution passed all test cases, but another player won first",
				IsWinner: false,
			}, nil
		}

		// 락 해제를 위한 defer 설정
		defer func() {
			s.rdb.Del(ctx, lockKey)
		}()

		// 승자 설정
		if err := s.matchRepo.SetWinner(matchID, userID); err != nil {
			s.logger.Error().Err(err).Msg("Failed to set winner")
			return nil, err
		}

		// Redis에서 게임 상태 업데이트
		matchKey := fmt.Sprintf("match:%s", matchID.String())
		if err := s.rdb.HSet(ctx, matchKey, "status", string(model.MatchStatusFinished)).Err(); err != nil {
			s.logger.Error().Err(err).Msg("Failed to update match status in Redis")
		}

		// Game end notification will be handled by real-time WebSocket updates
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

// UpdateCode 코드 업데이트 및 웹소켓 브로드캐스트
func (s *matchService) UpdateCode(matchID uuid.UUID, userID uuid.UUID, code string) error {
	match, err := s.matchRepo.FindByID(matchID)
	if err != nil {
		return err
	}

	// 게임 상태 체크
	if match.Status != model.MatchStatusPlaying {
		return errors.New("match is not in playing status")
	}

	// Redis에 코드 저장
	if err := s.redisManager.UpdateUserCode(matchID, userID, code); err != nil {
		return err
	}

	return nil
}

// GetPlayerCode 플레이어 코드 조회
func (s *matchService) GetPlayerCode(matchID uuid.UUID, userID uuid.UUID) (string, error) {
	return s.redisManager.GetUserCode(matchID, userID)
}

func (s *matchService) CloseMatch(matchID uuid.UUID, userID uuid.UUID) error {
	// DB에서 게임 방 닫기
	if err := s.matchRepo.CloseMatch(matchID, userID); err != nil {
		return err
	}

	// Redis에서 게임 관련 데이터 정리
	ctx := context.Background()

	// 게임에 참가한 사용자 목록 가져오기
	users, err := s.redisManager.GetMatchUsers(matchID)
	if err != nil {
		s.logger.Error().Err(err).Msg("Failed to get match users from Redis")
	}

	// 각 사용자를 매치에서 제거
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

	// 매치 완전 정리
	if err := s.redisManager.CleanupMatch(matchID); err != nil {
		s.logger.Error().Err(err).Msg("Failed to cleanup match")
	}

	// 승자 락 키도 정리
	lockKey := fmt.Sprintf("match:%s:winner_lock", matchID.String())
	s.rdb.Del(ctx, lockKey)

	return nil
}

// GetMatch 매치 조회
func (s *matchService) GetMatch(matchID uuid.UUID) (*model.Match, error) {
	match, err := s.matchRepo.FindByID(matchID)
	if err != nil {
		return nil, err
	}
	return match, nil
}

func (s *matchService) CreateMatch(player1ID, player2ID uuid.UUID, difficulty string) (*model.Match, error) {
	// Get a random LeetCode problem for the difficulty
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
	}

	// Save to database
	if err := s.matchRepo.Create(match); err != nil {
		s.logger.Error().Err(err).Msg("Failed to create match in database")
		return nil, fmt.Errorf("failed to create match: %w", err)
	}

	// Load the complete game with LeetCode details
	createdMatch, err := s.matchRepo.FindByID(match.ID)
	if err != nil {
		s.logger.Error().Err(err).Msg("Failed to load created match")
		return nil, fmt.Errorf("failed to load match: %w", err)
	}

	// Initialize Redis data using RedisManager
	if err := s.redisManager.CreateMatch(match.ID, player1ID, player2ID, leetcode.ID, difficulty); err != nil {
		s.logger.Error().Err(err).Msg("Failed to initialize Redis data for match")
		// Try to clean up the database record
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
