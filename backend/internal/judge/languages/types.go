package languages

import (
	"github.com/Dongmoon29/code_racer/internal/model"
)

// LanguageWrapper defines per-language wrapping behavior
type LanguageWrapper interface {
	WrapSingle(code string, testCase string, problem *model.LeetCode) string
	WrapBatch(code string, testCasesJSON string, problem *model.LeetCode) (string, error)
}
