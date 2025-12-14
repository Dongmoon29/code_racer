package service

import (
	"encoding/json"
	"testing"
)

func TestGetFloat64Time_ParsesStringAndNumber(t *testing.T) {
	if got := getFloat64Time("0.123"); got != 0.123 {
		t.Fatalf("expected 0.123, got=%v", got)
	}
	if got := getFloat64Time("  2.5 "); got != 2.5 {
		t.Fatalf("expected 2.5, got=%v", got)
	}
	if got := getFloat64Time(json.Number("3.75")); got != 3.75 {
		t.Fatalf("expected 3.75, got=%v", got)
	}
	if got := getFloat64Time(json.Number("not-a-number")); got != 0 {
		t.Fatalf("expected 0 for invalid number, got=%v", got)
	}
}
