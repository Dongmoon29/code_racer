package languages

import (
    "strings"
    "testing"
    "github.com/Dongmoon29/code_racer/internal/model"
)

func TestPyWrapper_WrapBatch(t *testing.T) {
    w := NewPyWrapper()
    prob := &model.LeetCode{ FunctionName: "solution" }
    code := "def solution(a,b):\n    return a+b"
    cases := "[[1,2],[3,4]]"
    out, err := w.WrapBatch(code, cases, prob)
    if err != nil { t.Fatalf("err: %v", err) }
    for _, s := range []string{"def run_all():", "json.loads('''", "solution(*inputs)", cases} {
        if !strings.Contains(out, s) { t.Fatalf("missing: %s", s) }
    }
}

func TestPyWrapper_WrapSingle(t *testing.T) {
    w := NewPyWrapper()
    prob := &model.LeetCode{ FunctionName: "solution" }
    code := "def solution(a):\n    return a"
    tc := "[1,2,3]"
    out := w.WrapSingle(code, tc, prob)
    for _, s := range []string{"def run_test():", "json.loads", "solution(*inputs)", tc} {
        if !strings.Contains(out, s) { t.Fatalf("missing: %s", s) }
    }
}


