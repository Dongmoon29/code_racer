package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/Dongmoon29/code_racer/internal/repository"
	"github.com/go-redis/redis/v8"
	"github.com/google/uuid"
)

// GameService 게임 관련 기능을 제공하는 인터페이스
type GameService interface {
	CreateGame(userID uuid.UUID, req *model.CreateGameRequest) (*model.GameResponse, error)
	GetGame(gameID uuid.UUID) (*model.GameResponse, error)
	ListGames() ([]*model.GameListResponse, error)
	ListLeetCodes() ([]*model.LeetCodeSummary, error)
	JoinGame(gameID uuid.UUID, userID uuid.UUID) (*model.GameResponse, error)
	SubmitSolution(gameID uuid.UUID, userID uuid.UUID, req *model.SubmitSolutionRequest) (*model.SubmitSolutionResponse, error)
	UpdateCode(gameID uuid.UUID, userID uuid.UUID, code string) error
	GetPlayerCode(gameID uuid.UUID, userID uuid.UUID) (string, error)
	CloseGame(gameID uuid.UUID, userID uuid.UUID) error
}

// gameService GameService 인터페이스 구현체
type gameService struct {
	gameRepo     repository.GameRepository
	leetCodeRepo repository.LeetCodeRepository
	rdb          *redis.Client
	wsService    WebSocketService
	judgeService JudgeService
	logger       logger.Logger
}

// NewGameService GameService 인스턴스 생성
func NewGameService(
	gameRepo repository.GameRepository,
	leetCodeRepo repository.LeetCodeRepository,
	rdb *redis.Client,
	wsService WebSocketService,
	judgeService JudgeService,
	logger logger.Logger,
) GameService {
	return &gameService{
		gameRepo:     gameRepo,
		leetCodeRepo: leetCodeRepo,
		rdb:          rdb,
		wsService:    wsService,
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

	if err := s.gameRepo.Create(game); err != nil {
		return nil, err
	}

	// 생성된 게임 정보 다시 조회 (관계 데이터 포함)
	createdGame, err := s.gameRepo.FindByID(game.ID)
	if err != nil {
		return nil, err
	}

	// Redis에 게임 방 정보 저장
	ctx := context.Background()
	gameKey := fmt.Sprintf("game:%s", createdGame.ID.String())
	if err := s.rdb.HSet(ctx, gameKey, "status", string(createdGame.Status)).Err(); err != nil {
		log.Printf("Failed to store game status in Redis: %v", err)
	}

	// 초기 코드 저장 (빈 문자열)
	creatorCodeKey := fmt.Sprintf("game:%s:user:%s:code", createdGame.ID.String(), userID.String())
	if err := s.rdb.Set(ctx, creatorCodeKey, "", 24*time.Hour).Err(); err != nil {
		log.Printf("Failed to initialize code in Redis: %v", err)
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

	// Redis에 게임 상태 업데이트
	ctx := context.Background()
	gameKey := fmt.Sprintf("game:%s", game.ID.String())
	if err := s.rdb.HSet(ctx, gameKey, "status", string(game.Status)).Err(); err != nil {
		log.Printf("Failed to update game status in Redis: %v", err)
	}

	// 참가자의 초기 코드 저장 (빈 문자열)
	opponentCodeKey := fmt.Sprintf("game:%s:user:%s:code", game.ID.String(), userID.String())
	if err := s.rdb.Set(ctx, opponentCodeKey, "", 24*time.Hour).Err(); err != nil {
		log.Printf("Failed to initialize opponent code in Redis: %v", err)
	}

	// 게임 시작 메시지 브로드캐스트
	gameStartMsg := map[string]interface{}{
		"type":    "game_start",
		"game_id": game.ID.String(),
	}

	msgBytes, err := json.Marshal(gameStartMsg)
	if err != nil {
		log.Printf("Failed to marshal game start message: %v", err)
		return game.ToResponse(), nil
	}
	s.wsService.BroadcastToGame(game.ID, msgBytes)

	return game.ToResponse(), nil
}

// SubmitSolution 코드 제출 및 평가
func (s *gameService) SubmitSolution(gameID uuid.UUID, userID uuid.UUID, req *model.SubmitSolutionRequest) (*model.SubmitSolutionResponse, error) {
	// 게임 정보 조회
	game, err := s.gameRepo.FindByID(gameID)
	if err != nil {
		return nil, err
	}

	// 게임 상태 체크
	if game.Status != model.GameStatusPlaying {
		return nil, errors.New("game is not in playing status")
	}

	// Judge0 API를 통해 코드 평가
	result, err := s.judgeService.EvaluateCode(req.Code, req.Language, &game.LeetCode)
	if err != nil {
		return nil, err
	}
	s.logger.Debug().
		Bool("passed", result.Passed).
		Float64("executionTime", result.ExecutionTime).
		Float64("memoryUsage", result.MemoryUsage).
		Int("testCaseCount", len(result.TestResults)).
		Str("errorMessage", result.ErrorMessage).
		Msg("Code evaluation result")

	// 코드가 모든 테스트 케이스를 통과했는지 확인
	if result.Passed {
		// 승자 설정
		if err := s.gameRepo.SetWinner(gameID, userID); err != nil {
			return nil, err
		}

		// 게임 종료 메시지 브로드캐스트
		gameEndMsg := map[string]interface{}{
			"type":      "game_end",
			"game_id":   game.ID.String(),
			"winner_id": userID.String(),
		}

		msgBytes, err := json.Marshal(gameEndMsg)
		if err != nil {
			log.Printf("Failed to marshal game end message: %v", err)
			return &model.SubmitSolutionResponse{
				Success:  true,
				Message:  "Your solution passed all test cases",
				IsWinner: true,
			}, nil
		}

		s.wsService.BroadcastToGame(game.ID, msgBytes)

		return &model.SubmitSolutionResponse{
			Success:  true,
			Message:  "Your solution passed all test cases",
			IsWinner: true,
		}, nil
	}

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

	// 코드 업데이트 메시지 브로드캐스트
	codeUpdateMsg := map[string]interface{}{
		"type":    "code_update",
		"game_id": gameID.String(),
		"user_id": userID.String(),
		"code":    code,
	}

	msgBytes, err := json.Marshal(codeUpdateMsg)
	if err != nil {
		log.Printf("Failed to marshal codeUpdate message: %v", err)
		return nil
	}

	s.wsService.BroadcastToGame(game.ID, msgBytes)

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
	// 게임 방 닫기
	if err := s.gameRepo.CloseGame(gameID, userID); err != nil {
		return err
	}

	// Redis에서 게임 상태 업데이트
	ctx := context.Background()
	gameKey := fmt.Sprintf("game:%s", gameID.String())
	if err := s.rdb.HSet(ctx, gameKey, "status", string(model.GameStatusClosed)).Err(); err != nil {
		log.Printf("Failed to update game status in Redis: %v", err)
	}

	// 게임 종료 메시지 브로드캐스트
	gameClosedMsg := map[string]interface{}{
		"type":    "game_closed",
		"game_id": gameID.String(),
	}

	msgBytes, err := json.Marshal(gameClosedMsg)
	if err != nil {
		log.Printf("Failed to marshal game closed message: %v", err)
		return nil
	}
	s.wsService.BroadcastToGame(gameID, msgBytes)

	return nil
}
