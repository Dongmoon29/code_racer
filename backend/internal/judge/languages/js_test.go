package languages

import (
	"strings"
	"testing"

	"github.com/Dongmoon29/code_racer/internal/model"
)

func TestJSWrapper_WrapBatch(t *testing.T) {
	w := NewJSWrapper()
	prob := &model.Problem{FunctionName: "solution"}
	code := "function solution(a,b){ return a+b }"
	cases := "[[1,2],[3,4]]"
	out, err := w.WrapBatch(code, cases, prob)
	if err != nil {
		t.Fatalf("err: %v", err)
	}
	for _, s := range []string{"runAll()", "const cases =", "solution(...inputs)", cases} {
		if !strings.Contains(out, s) {
			t.Fatalf("missing: %s", s)
		}
	}
}

func TestJSWrapper_WrapSingle(t *testing.T) {
	w := NewJSWrapper()
	prob := &model.Problem{FunctionName: "solution"}
	code := "function solution(a){ return a }"
	tc := "[1,2,3]"
	out := w.WrapSingle(code, tc, prob)
	for _, s := range []string{"runTest()", "JSON.parse", "solution(...inputs)", tc} {
		if !strings.Contains(out, s) {
			t.Fatalf("missing: %s", s)
		}
	}
}
