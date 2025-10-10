package interfaces

import (
	"context"

	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/Dongmoon29/code_racer/internal/types"
	"github.com/google/uuid"
)

type JudgeService interface {
	EvaluateCode(code string, language string, problem *model.LeetCode) (*types.EvaluationResult, error)
	EvaluateCodeWithRealtime(code string, language string, problem *model.LeetCode, matchID uuid.UUID, userID uuid.UUID) (*types.EvaluationResult, error)
	WrapCodeWithTestCase(code string, languageID int, testCase string, problem *model.LeetCode) (string, error)
}

type CodeWrapper interface {
	WrapCode(code string, languageID int, testCase string, problem *model.LeetCode) (string, error)
	WrapCodeBatch(code string, languageID int, testCasesJSON string, problem *model.LeetCode) (string, error)
}

type Judge0Client interface {
	SubmitCode(ctx context.Context, request types.Judge0Request) (*types.Judge0Response, error)
	Close()
	GetRateLimitStatus() int
}

// WebSocketBroadcaster WebSocket 브로드캐스터 인터페이스
type WebSocketBroadcaster interface {
	BroadcastToMatch(matchID uuid.UUID, message []byte)
	BroadcastToAllClients(message []byte)
}
