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
	logger       logger.Logger
	judgeService interfaces.JudgeService
}

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
	ctx := context.Background()
	codeKey := fmt.Sprintf("match:%s:user:%s:code", matchID.String(), userID.String())
	if err := s.rdb.Set(ctx, codeKey, code, 24*time.Hour).Err(); err != nil {
		return err
	}

	return nil
}

// GetPlayerCode 플레이어 코드 조회
func (s *matchService) GetPlayerCode(matchID uuid.UUID, userID uuid.UUID) (string, error) {
	ctx := context.Background()
	codeKey := fmt.Sprintf("match:%s:user:%s:code", matchID.String(), userID.String())

	code, err := s.rdb.Get(ctx, codeKey).Result()
	if err != nil {
		if err == redis.Nil {
			return "", nil // 코드가 없는 경우 빈 문자열 반환
		}
		return "", err
	}

	return code, nil
}

func (s *matchService) CloseMatch(matchID uuid.UUID, userID uuid.UUID) error {
	// DB에서 게임 방 닫기
	if err := s.matchRepo.CloseMatch(matchID, userID); err != nil {
		return err
	}

	// Redis에서 게임 관련 데이터 원자적 정리
	ctx := context.Background()
	matchKey := fmt.Sprintf("match:%s", matchID.String())
	matchUsersKey := fmt.Sprintf("match:%s:users", matchID.String())

	// 게임에 참가한 사용자 목록 가져오기
	users, err := s.rdb.SMembers(ctx, matchUsersKey).Result()
	if err != nil {
		s.logger.Error().Err(err).Msg("Failed to get match users from Redis")
	}

	// Redis 파이프라인을 사용한 원자적 정리
	pipe := s.rdb.Pipeline()

	// 게임 상태 업데이트
	pipe.HSet(ctx, matchKey, "status", string(model.MatchStatusClosed))

	// 각 사용자의 코드 데이터 삭제
	for _, uid := range users {
		codeKey := fmt.Sprintf("match:%s:user:%s:code", matchID.String(), uid)
		pipe.Del(ctx, codeKey)
	}

	// 게임 관련 키들 삭제
	pipe.Del(ctx, matchKey, matchUsersKey)

	// 승자 락 키도 정리
	lockKey := fmt.Sprintf("match:%s:winner_lock", matchID.String())
	pipe.Del(ctx, lockKey)

	if _, err := pipe.Exec(ctx); err != nil {
		s.logger.Error().Err(err).Msg("Failed to cleanup Redis data")
	}

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

	// Initialize Redis data for both players
	ctx := context.Background()
	gameKey := fmt.Sprintf("match:%s", match.ID.String())
	player1CodeKey := fmt.Sprintf("match:%s:user:%s:code", match.ID.String(), player1ID.String())
	player2CodeKey := fmt.Sprintf("match:%s:user:%s:code", match.ID.String(), player2ID.String())
	matchUsersKey := fmt.Sprintf("match:%s:users", match.ID.String())

	// Use Redis pipeline for atomic operations
	pipe := s.rdb.Pipeline()
	pipe.HSet(ctx, gameKey, "status", string(match.Status))
	pipe.Set(ctx, player1CodeKey, "", 24*time.Hour)
	pipe.Set(ctx, player2CodeKey, "", 24*time.Hour)
	pipe.SAdd(ctx, matchUsersKey, player1ID.String(), player2ID.String())
	pipe.Expire(ctx, matchUsersKey, 24*time.Hour)

	if _, err := pipe.Exec(ctx); err != nil {
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
