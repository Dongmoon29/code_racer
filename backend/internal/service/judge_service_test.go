package service_test // service가 아닌 service_test 패키지 사용

import (
	"testing"

	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/Dongmoon29/code_racer/internal/testutil"
	"github.com/stretchr/testify/assert"
)

func TestWrapCodeWithInvalidLanguage(t *testing.T) {
	testLogger := testutil.SetupTestLogger()
	service := testutil.SetupTestJudgeService(testLogger)

	code := "function test() {}"
	languageID := 9999 // 잘못된 언어 ID
	testCase := "[1,2,3]"
	problem := &model.LeetCode{
		FunctionName: "test",
		InputFormat:  "array",
		OutputFormat: "array",
	}

	_, err := service.WrapCodeWithTestCase(code, languageID, testCase, problem)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "unsupported programming language")
}
