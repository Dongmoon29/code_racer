package judge

import (
	"io"
	"strings"
	"testing"

	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/rs/zerolog"
)

func batchTestLogger() *zerolog.Logger {
	l := zerolog.New(io.Discard).With().Timestamp().Logger()
	return &l
}

func TestWrapCodeBatch_Javascript(t *testing.T) {
	logger := batchTestLogger()
	w := NewCodeWrapper(logger)

	problem := &model.Problem{
		FunctionName: "twoSum",
		IOSchema: model.IOSchema{
			ParamTypes: `["int[]","int"]`,
			ReturnType: "int[]",
		},
	}
	code := "function twoSum(nums, target) { return [0, 1]; }"
	cases := "[[1,2],[3,4]]"

	out, err := w.WrapCodeBatch(code, 63, cases, problem)
	if err != nil {
		t.Fatalf("unexpected err: %v", err)
	}

	mustContain := []string{
		"readFileSync(0, 'utf-8')",
		"const testCases = JSON.parse(raw)",
		"twoSum(...args)",
		"function twoSum",
	}
	for _, s := range mustContain {
		if !strings.Contains(out, s) {
			t.Fatalf("output missing: %s", s)
		}
	}
}

func TestWrapCodeBatch_Go(t *testing.T) {
	logger := batchTestLogger()
	w := NewCodeWrapper(logger)

	problem := &model.Problem{
		FunctionName: "twoSum",
		IOSchema: model.IOSchema{
			ParamTypes: `["int[]","int"]`,
			ReturnType: "int[]",
		},
	}
	code := "func twoSum(nums []int, target int) []int { return []int{0, 1} }"
	cases := "[[1,2],[3,4]]"

	_, err := w.WrapCodeBatch(code, 60, cases, problem)
	if err == nil {
		t.Fatalf("expected err, got nil")
	}
}
