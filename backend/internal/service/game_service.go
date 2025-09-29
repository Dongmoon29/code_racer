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

// GameService 게임 관련 기능을 제공하는 인터페이스
type GameService interface {
	GetGame(gameID uuid.UUID) (*model.GameResponse, error)
	SubmitSolution(gameID uuid.UUID, userID uuid.UUID, req *model.SubmitSolutionRequest) (*model.SubmitSolutionResponse, error)
	UpdateCode(gameID uuid.UUID, userID uuid.UUID, code string) error
	GetPlayerCode(gameID uuid.UUID, userID uuid.UUID) (string, error)

	// Matchmaking methods
	CreateGameForMatch(player1ID, player2ID uuid.UUID, difficulty string) (*model.Game, error)
	GetRandomLeetCodeByDifficulty(difficulty string) (*model.LeetCode, error)
	CreateGameFromMatch(matchID string, userID uuid.UUID) (*model.GameResponse, error)

	ListLeetCodes() ([]*model.LeetCodeSummary, error)
	CreateLeetCode(req *model.CreateLeetCodeRequest) (*model.LeetCodeDetail, error)
	UpdateLeetCode(id uuid.UUID, req *model.UpdateLeetCodeRequest) (*model.LeetCodeDetail, error)
	DeleteLeetCode(id uuid.UUID) error
	GetLeetCode(id uuid.UUID) (*model.LeetCodeDetail, error)
}

// gameService GameService 인터페이스 구현체
type gameService struct {
	gameRepo     repository.GameRepository
	leetCodeRepo repository.LeetCodeRepository
	rdb          *redis.Client
	logger       logger.Logger
	judgeService interfaces.JudgeService
}

// NewGameService GameService 인스턴스 생성
func NewGameService(
	gameRepo repository.GameRepository,
	leetCodeRepo repository.LeetCodeRepository,
	rdb *redis.Client,
	judgeService interfaces.JudgeService,
	logger logger.Logger,
) GameService {
	return &gameService{
		gameRepo:     gameRepo,
		leetCodeRepo: leetCodeRepo,
		rdb:          rdb,
		judgeService: judgeService,
		logger:       logger,
	}
}

// CreateGame 게임 방 생성
func (s *gameService) CreateGame(userID uuid.UUID, req *model.CreateGameRequest) (*model.GameResponse, error) {
	// LeetCode 문제 조회
	leetcode, err := s.leetCodeRepo.FindByID(req.LeetCodeID)
	if err != nil {
		return nil, err
	}

	// 게임 방 생성
	game := &model.Game{
		CreatorID:  userID,
		LeetCodeID: leetcode.ID,
		Status:     model.GameStatusWaiting,
	}

	// DB에 게임 생성
	if err := s.gameRepo.Create(game); err != nil {
		return nil, err
	}

	// 생성된 게임 정보 다시 조회 (관계 데이터 포함)
	createdGame, err := s.gameRepo.FindByID(game.ID)
	if err != nil {
		return nil, err
	}

	// Redis에 게임 방 정보와 초기 코드를 원자적으로 저장
	ctx := context.Background()
	gameKey := fmt.Sprintf("game:%s", createdGame.ID.String())
	creatorCodeKey := fmt.Sprintf("game:%s:user:%s:code", createdGame.ID.String(), userID.String())

	// Redis 파이프라인을 사용한 원자적 처리
	pipe := s.rdb.Pipeline()
	pipe.HSet(ctx, gameKey, "status", string(createdGame.Status))
	pipe.Set(ctx, creatorCodeKey, "", 24*time.Hour)

	if _, err := pipe.Exec(ctx); err != nil {
		// Redis 저장 실패 시 DB에서 게임 삭제 (롤백)
		s.logger.Error().Err(err).Msg("Failed to store game data in Redis, rolling back")
		if deleteErr := s.gameRepo.Delete(game.ID); deleteErr != nil {
			s.logger.Error().Err(deleteErr).Msg("Failed to rollback game creation")
		}
		return nil, fmt.Errorf("failed to initialize game: %w", err)
	}

	return createdGame.ToResponse(), nil
}

// GetGame 게임 방 정보 조회
func (s *gameService) GetGame(gameID uuid.UUID) (*model.GameResponse, error) {
	game, err := s.gameRepo.FindByID(gameID)
	if err != nil {
		return nil, err
	}

	return game.ToResponse(), nil
}

// ListGames 게임 방 목록 조회
func (s *gameService) ListGames() ([]*model.GameListResponse, error) {
	games, err := s.gameRepo.FindOpenGames()
	if err != nil {
		return nil, err
	}

	var result []*model.GameListResponse
	for _, game := range games {
		result = append(result, game.ToListResponse())
	}

	return result, nil
}

// ListLeetCodes LeetCode 문제 목록 조회
func (s *gameService) ListLeetCodes() ([]*model.LeetCodeSummary, error) {
	leetcodes, err := s.leetCodeRepo.FindAll()
	if err != nil {
		return nil, err
	}

	var result []*model.LeetCodeSummary
	for _, leetcode := range leetcodes {
		result = append(result, leetcode.ToSummaryResponse())
	}

	return result, nil
}

// JoinGame 게임 방 참가
func (s *gameService) JoinGame(gameID uuid.UUID, userID uuid.UUID) (*model.GameResponse, error) {
	// 게임 방 참가 처리
	game, err := s.gameRepo.JoinGame(gameID, userID)
	if err != nil {
		return nil, err
	}

	// Redis에 게임 상태와 참가자 코드를 원자적으로 업데이트
	ctx := context.Background()
	gameKey := fmt.Sprintf("game:%s", game.ID.String())
	opponentCodeKey := fmt.Sprintf("game:%s:user:%s:code", game.ID.String(), userID.String())
	gameUsersKey := fmt.Sprintf("game:%s:users", game.ID.String())

	// Redis 파이프라인을 사용한 원자적 처리
	pipe := s.rdb.Pipeline()
	pipe.HSet(ctx, gameKey, "status", string(game.Status))
	pipe.Set(ctx, opponentCodeKey, "", 24*time.Hour)
	pipe.SAdd(ctx, gameUsersKey, userID.String())
	pipe.Expire(ctx, gameUsersKey, 24*time.Hour)

	if _, err := pipe.Exec(ctx); err != nil {
		s.logger.Error().Err(err).Msg("Failed to update Redis after joining game")
		// Redis 실패는 로그만 남기고 게임은 계속 진행 (DB 상태는 이미 업데이트됨)
	}
	return game.ToResponse(), nil
}

// SubmitSolution 코드 제출 및 평가
func (s *gameService) SubmitSolution(gameID uuid.UUID, userID uuid.UUID, req *model.SubmitSolutionRequest) (*model.SubmitSolutionResponse, error) {
	s.logger.Debug().
		Str("gameID", gameID.String()).
		Str("userID", userID.String()).
		Msg("Starting solution submission")

	// 게임 정보 조회
	game, err := s.gameRepo.FindByID(gameID)
	if err != nil {
		s.logger.Error().Err(err).Msg("Failed to find game")
		return nil, err
	}

	// 게임 상태 체크
	if game.Status != model.GameStatusPlaying {
		s.logger.Error().
			Str("status", string(game.Status)).
			Msg("Game is not in playing status")
		return nil, errors.New("game is not in playing status")
	}

	s.logger.Debug().
		Str("code", req.Code).
		Str("language", req.Language).
		Msg("Evaluating submitted code")

	// Judge0 API를 통해 코드 평가
	result, err := s.judgeService.EvaluateCode(req.Code, req.Language, &game.LeetCode)
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
		lockKey := fmt.Sprintf("game:%s:winner_lock", gameID.String())
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
		if err := s.gameRepo.SetWinner(gameID, userID); err != nil {
			s.logger.Error().Err(err).Msg("Failed to set winner")
			return nil, err
		}

		// Redis에서 게임 상태 업데이트
		gameKey := fmt.Sprintf("game:%s", gameID.String())
		if err := s.rdb.HSet(ctx, gameKey, "status", string(model.GameStatusFinished)).Err(); err != nil {
			s.logger.Error().Err(err).Msg("Failed to update game status in Redis")
		}

		// Game end notification will be handled by real-time WebSocket updates
		s.logger.Info().Msg("Game completed - winner determined")

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
func (s *gameService) UpdateCode(gameID uuid.UUID, userID uuid.UUID, code string) error {
	// 게임 정보 조회
	game, err := s.gameRepo.FindByID(gameID)
	if err != nil {
		return err
	}

	// 게임 상태 체크
	if game.Status != model.GameStatusPlaying {
		return errors.New("game is not in playing status")
	}

	// Redis에 코드 저장
	ctx := context.Background()
	codeKey := fmt.Sprintf("game:%s:user:%s:code", gameID.String(), userID.String())
	if err := s.rdb.Set(ctx, codeKey, code, 24*time.Hour).Err(); err != nil {
		return err
	}

	return nil
}

// GetPlayerCode 플레이어 코드 조회
func (s *gameService) GetPlayerCode(gameID uuid.UUID, userID uuid.UUID) (string, error) {
	ctx := context.Background()
	codeKey := fmt.Sprintf("game:%s:user:%s:code", gameID.String(), userID.String())

	code, err := s.rdb.Get(ctx, codeKey).Result()
	if err != nil {
		if err == redis.Nil {
			return "", nil // 코드가 없는 경우 빈 문자열 반환
		}
		return "", err
	}

	return code, nil
}

// CloseGame 게임 방 닫기
func (s *gameService) CloseGame(gameID uuid.UUID, userID uuid.UUID) error {
	// DB에서 게임 방 닫기
	if err := s.gameRepo.CloseGame(gameID, userID); err != nil {
		return err
	}

	// Redis에서 게임 관련 데이터 원자적 정리
	ctx := context.Background()
	gameKey := fmt.Sprintf("game:%s", gameID.String())
	gameUsersKey := fmt.Sprintf("game:%s:users", gameID.String())

	// 게임에 참가한 사용자 목록 가져오기
	users, err := s.rdb.SMembers(ctx, gameUsersKey).Result()
	if err != nil {
		s.logger.Error().Err(err).Msg("Failed to get game users from Redis")
	}

	// Redis 파이프라인을 사용한 원자적 정리
	pipe := s.rdb.Pipeline()

	// 게임 상태 업데이트
	pipe.HSet(ctx, gameKey, "status", string(model.GameStatusClosed))

	// 각 사용자의 코드 데이터 삭제
	for _, uid := range users {
		codeKey := fmt.Sprintf("game:%s:user:%s:code", gameID.String(), uid)
		pipe.Del(ctx, codeKey)
	}

	// 게임 관련 키들 삭제
	pipe.Del(ctx, gameKey, gameUsersKey)

	// 승자 락 키도 정리
	lockKey := fmt.Sprintf("game:%s:winner_lock", gameID.String())
	pipe.Del(ctx, lockKey)

	if _, err := pipe.Exec(ctx); err != nil {
		s.logger.Error().Err(err).Msg("Failed to cleanup Redis data")
	}

	// Game close notifications will be handled by WebSocket disconnection

	return nil
}

func (s *gameService) CreateLeetCode(req *model.CreateLeetCodeRequest) (*model.LeetCodeDetail, error) {
	leetcode := &model.LeetCode{
		Title:              req.Title,
		Description:        req.Description,
		Examples:           req.Examples,
		Constraints:        req.Constraints,
		TestCases:          req.TestCases,
		ExpectedOutputs:    req.ExpectedOutputs,
		Difficulty:         req.Difficulty,
		InputFormat:        req.InputFormat,
		OutputFormat:       req.OutputFormat,
		FunctionName:       req.FunctionName,
		JavaScriptTemplate: req.JavaScriptTemplate,
		PythonTemplate:     req.PythonTemplate,
		GoTemplate:         req.GoTemplate,
		JavaTemplate:       req.JavaTemplate,
		CPPTemplate:        req.CPPTemplate,
	}

	if err := s.leetCodeRepo.Create(leetcode); err != nil {
		return nil, err
	}

	return leetcode.ToDetailResponse(), nil
}

func (s *gameService) UpdateLeetCode(id uuid.UUID, req *model.UpdateLeetCodeRequest) (*model.LeetCodeDetail, error) {
	leetcode, err := s.leetCodeRepo.FindByID(id)
	if err != nil {
		return nil, err
	}

	// 필드 업데이트
	leetcode.Title = req.Title
	leetcode.Description = req.Description
	leetcode.Examples = req.Examples
	leetcode.Constraints = req.Constraints
	leetcode.TestCases = req.TestCases
	leetcode.ExpectedOutputs = req.ExpectedOutputs
	leetcode.Difficulty = req.Difficulty
	leetcode.InputFormat = req.InputFormat
	leetcode.OutputFormat = req.OutputFormat
	leetcode.FunctionName = req.FunctionName
	leetcode.JavaScriptTemplate = req.JavaScriptTemplate
	leetcode.PythonTemplate = req.PythonTemplate
	leetcode.GoTemplate = req.GoTemplate
	leetcode.JavaTemplate = req.JavaTemplate
	leetcode.CPPTemplate = req.CPPTemplate

	if err := s.leetCodeRepo.Update(leetcode); err != nil {
		return nil, err
	}

	return leetcode.ToDetailResponse(), nil
}

func (s *gameService) DeleteLeetCode(id uuid.UUID) error {
	return s.leetCodeRepo.Delete(id)
}

func (s *gameService) GetLeetCode(id uuid.UUID) (*model.LeetCodeDetail, error) {
	leetcode, err := s.leetCodeRepo.FindByID(id)
	if err != nil {
		return nil, err
	}
	return leetcode.ToDetailResponse(), nil
}

// CreateGameForMatch creates a new game for matched players
func (s *gameService) CreateGameForMatch(player1ID, player2ID uuid.UUID, difficulty string) (*model.Game, error) {
	// Get a random LeetCode problem for the difficulty
	leetcode, err := s.GetRandomLeetCodeByDifficulty(difficulty)
	if err != nil {
		s.logger.Error().Err(err).Str("difficulty", difficulty).Msg("Failed to get random LeetCode problem")
		return nil, fmt.Errorf("failed to get problem for difficulty %s: %w", difficulty, err)
	}

	// Create new game
	game := &model.Game{
		CreatorID:  player1ID,
		OpponentID: &player2ID,
		LeetCodeID: leetcode.ID,
		Status:     model.GameStatusPlaying, // Start immediately for matched games
	}

	// Save to database
	if err := s.gameRepo.Create(game); err != nil {
		s.logger.Error().Err(err).Msg("Failed to create matched game in database")
		return nil, fmt.Errorf("failed to create game: %w", err)
	}

	// Load the complete game with LeetCode details
	createdGame, err := s.gameRepo.FindByID(game.ID)
	if err != nil {
		s.logger.Error().Err(err).Msg("Failed to load created game")
		return nil, fmt.Errorf("failed to load game: %w", err)
	}

	// Initialize Redis data for both players
	ctx := context.Background()
	gameKey := fmt.Sprintf("game:%s", game.ID.String())
	player1CodeKey := fmt.Sprintf("game:%s:user:%s:code", game.ID.String(), player1ID.String())
	player2CodeKey := fmt.Sprintf("game:%s:user:%s:code", game.ID.String(), player2ID.String())
	gameUsersKey := fmt.Sprintf("game:%s:users", game.ID.String())

	// Use Redis pipeline for atomic operations
	pipe := s.rdb.Pipeline()
	pipe.HSet(ctx, gameKey, "status", string(game.Status))
	pipe.Set(ctx, player1CodeKey, "", 24*time.Hour)
	pipe.Set(ctx, player2CodeKey, "", 24*time.Hour)
	pipe.SAdd(ctx, gameUsersKey, player1ID.String(), player2ID.String())
	pipe.Expire(ctx, gameUsersKey, 24*time.Hour)

	if _, err := pipe.Exec(ctx); err != nil {
		s.logger.Error().Err(err).Msg("Failed to initialize Redis data for matched game")
		// Try to clean up the database record
		if deleteErr := s.gameRepo.Delete(game.ID); deleteErr != nil {
			s.logger.Error().Err(deleteErr).Msg("Failed to rollback game creation")
		}
		return nil, fmt.Errorf("failed to initialize game data: %w", err)
	}

	s.logger.Info().
		Str("gameID", game.ID.String()).
		Str("player1ID", player1ID.String()).
		Str("player2ID", player2ID.String()).
		Str("difficulty", difficulty).
		Str("problem", leetcode.Title).
		Msg("Successfully created matched game")

	return createdGame, nil
}

// GetRandomLeetCodeByDifficulty gets a random LeetCode problem by difficulty
func (s *gameService) GetRandomLeetCodeByDifficulty(difficulty string) (*model.LeetCode, error) {
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

// CreateGameFromMatch creates a game from a completed match
func (s *gameService) CreateGameFromMatch(matchID string, userID uuid.UUID) (*model.GameResponse, error) {
	// Get match info from Redis
	ctx := context.Background()
	matchKey := fmt.Sprintf("match:%s", matchID)

	matchData, err := s.rdb.HGetAll(ctx, matchKey).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to get match data: %w", err)
	}

	if len(matchData) == 0 {
		return nil, fmt.Errorf("match not found or expired")
	}

	// Parse match data
	player1ID, err := uuid.Parse(matchData["player1_id"])
	if err != nil {
		return nil, fmt.Errorf("invalid player1 ID in match")
	}

	player2ID, err := uuid.Parse(matchData["player2_id"])
	if err != nil {
		return nil, fmt.Errorf("invalid player2 ID in match")
	}

	difficulty := matchData["difficulty"]

	// Verify user is part of this match
	if userID != player1ID && userID != player2ID {
		return nil, fmt.Errorf("user not authorized for this match")
	}

	// Create the game
	game, err := s.CreateGameForMatch(player1ID, player2ID, difficulty)
	if err != nil {
		return nil, fmt.Errorf("failed to create game: %w", err)
	}

	// Clean up match data
	s.rdb.Del(ctx, matchKey)

	s.logger.Info().
		Str("matchID", matchID).
		Str("gameID", game.ID.String()).
		Str("userID", userID.String()).
		Msg("Successfully created game from match")

	return game.ToResponse(), nil
}
