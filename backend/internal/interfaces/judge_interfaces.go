package interfaces

import (
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/Dongmoon29/code_racer/internal/types"
)

type JudgeService interface {
	EvaluateCode(code string, language string, problem *model.LeetCode) (*types.EvaluationResult, error)
	WrapCodeWithTestCase(code string, languageID int, testCase string, problem *model.LeetCode) (string, error)
}

type CodeWrapper interface {
	WrapCode(code string, languageID int, testCase string, problem *model.LeetCode) (string, error)
	WrapCodeBatch(code string, languageID int, testCasesJSON string, problem *model.LeetCode) (string, error)
}

type Judge0Client interface {
	SubmitCode(request types.Judge0Request) (*types.Judge0Response, error)
}
