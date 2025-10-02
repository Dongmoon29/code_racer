package golang

import (
    "strings"
    "testing"
    "github.com/Dongmoon29/code_racer/internal/model"
)

func TestWrapper_WrapSingle_Go_VariadicFallback(t *testing.T) {
    w := NewWrapper()
    prob := &model.LeetCode{ FunctionName: "solution" }
    code := "package main\nfunc solution(args ...interface{}) interface{} { return args }"
    tc := "[1,2,3]"
    out := w.WrapSingle(code, tc, prob)
    for _, s := range []string{"solution(testCase...)"} {
        if !strings.Contains(out, s) { t.Fatalf("missing: %s", s) }
    }
}

func TestWrapper_WrapBatch_Go_VariadicFallback(t *testing.T) {
    w := NewWrapper()
    prob := &model.LeetCode{ FunctionName: "solution" }
    code := "package main\nfunc solution(args ...interface{}) interface{} { return args }"
    cases := "[[1,2],[3]]"
    out, err := w.WrapBatch(code, cases, prob)
    if err != nil { t.Fatalf("err: %v", err) }
    t.Log(out)
    for _, s := range []string{"out := solution(c...)"} {
        if !strings.Contains(out, s) { t.Fatalf("missing: %s", s) }
    }
}


