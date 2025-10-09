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

	problem := &model.LeetCode{FunctionName: "solution"}
	code := "function solution(a,b){ return a+b }"
	cases := "[[1,2],[3,4]]"

	out, err := w.WrapCodeBatch(code, 63, cases, problem)
	if err != nil {
		t.Fatalf("unexpected err: %v", err)
	}

	mustContain := []string{
		"runAll()",
		"const cases =",
		"solution(...inputs)",
		cases,
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

	problem := &model.LeetCode{FunctionName: "solution"}
	code := "def solution(a,b):\n    return a+b"
	cases := "[[1,2],[3,4]]"

	out, err := w.WrapCodeBatch(code, 71, cases, problem)
	if err != nil {
		t.Fatalf("unexpected err: %v", err)
	}

	mustContain := []string{
		"def run_all():",
		"json.loads('''",
		"solution(*inputs)",
		cases,
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

	problem := &model.LeetCode{FunctionName: "solution"}
	code := "func solution(args ...interface{}) interface{} { return args }"
	cases := "[[1,2],[3,4]]"

	out, err := w.WrapCodeBatch(code, 60, cases, problem)
	if err != nil {
		t.Fatalf("unexpected err: %v", err)
	}

	mustContain := []string{
		"package main",
		"json.Unmarshal",
		"solution(",
		"toInt(c[0])",
		cases,
	}
	for _, s := range mustContain {
		if !strings.Contains(out, s) {
			t.Fatalf("output missing: %s", s)
		}
	}
}
