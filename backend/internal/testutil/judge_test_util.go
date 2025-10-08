package testutil

import (
	"fmt"

	"github.com/Dongmoon29/code_racer/internal/interfaces"
	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/Dongmoon29/code_racer/internal/types"
	"github.com/google/uuid"
)

// MockJudgeService implements interfaces.JudgeService for testing
type MockJudgeService struct {
	Logger logger.Logger
}

func (m *MockJudgeService) EvaluateCode(code string, language string, problem *model.LeetCode) (*types.EvaluationResult, error) {
	return &types.EvaluationResult{
		Passed: true,
		TestResults: []types.TestCaseResult{
			{
				TestCaseIndex: 0,
				Passed:        true,
				Input:         "[1,2,3]",
				Expected:      "[6]",
				Actual:        "[6]",
			},
		},
	}, nil
}

func (m *MockJudgeService) WrapCodeWithTestCase(code string, languageID int, testCase string, problem *model.LeetCode) (string, error) {
	if languageID == 9999 {
		return "", fmt.Errorf("unsupported programming language ID: %d", languageID)
	}
	return "wrapped code", nil
}

func (m *MockJudgeService) EvaluateCodeWithRealtime(code string, language string, problem *model.LeetCode, matchID uuid.UUID, userID uuid.UUID) (*types.EvaluationResult, error) {
	// Mock implementation - just return the same result as EvaluateCode
	return m.EvaluateCode(code, language, problem)
}

// SetupTestJudgeService creates a mock JudgeService instance for testing
func SetupTestJudgeService(logger logger.Logger) interfaces.JudgeService {
	return &MockJudgeService{
		Logger: logger,
	}
}
