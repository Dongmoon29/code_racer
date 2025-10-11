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

	problem := &model.Problem{FunctionName: "twoSum"}
	code := "function twoSum(nums, target) { return [0, 1]; }"
	cases := "[[1,2],[3,4]]"

	out, err := w.WrapCodeBatch(code, 63, cases, problem)
	if err != nil {
		t.Fatalf("unexpected err: %v", err)
	}

	mustContain := []string{
		"process.argv[2]",
		"twoSum(...inputs)",
		"function twoSum",
	}
	for _, s := range mustContain {
		if !strings.Contains(out, s) {
			t.Fatalf("output missing: %s", s)
		}
	}
}

func TestWrapCodeBatch_Python(t *testing.T) {
	logger := batchTestLogger()
	w := NewCodeWrapper(logger)

	problem := &model.Problem{FunctionName: "twoSum"}
	code := "def twoSum(nums, target):\n    return [0, 1]"
	cases := "[[1,2],[3,4]]"

	out, err := w.WrapCodeBatch(code, 71, cases, problem)
	if err != nil {
		t.Fatalf("unexpected err: %v", err)
	}

	mustContain := []string{
		"sys.argv[1]",
		"twoSum(*inputs)",
		"def twoSum",
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

	problem := &model.Problem{FunctionName: "twoSum"}
	code := "func twoSum(nums []int, target int) []int { return []int{0, 1} }"
	cases := "[[1,2],[3,4]]"

	out, err := w.WrapCodeBatch(code, 60, cases, problem)
	if err != nil {
		t.Fatalf("unexpected err: %v", err)
	}

	mustContain := []string{
		"package main",
		"os.Args[1]",
		"twoSum(",
		"toIntSlice",
	}
	for _, s := range mustContain {
		if !strings.Contains(out, s) {
			t.Fatalf("output missing: %s", s)
		}
	}
}
