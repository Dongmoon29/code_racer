package judge

import "testing"

func TestTruncateForLog(t *testing.T) {
	got, truncated := truncateForLog("hello", 10)
	if got != "hello" || truncated {
		t.Fatalf("expected no truncation, got=%q truncated=%v", got, truncated)
	}

	got, truncated = truncateForLog("0123456789ABCDEF", 10)
	if truncated != true {
		t.Fatalf("expected truncation=true")
	}
	if got != "0123456789...(truncated)" {
		t.Fatalf("unexpected truncated string: %q", got)
	}

	got, truncated = truncateForLog("hello", 0)
	if got != "" || !truncated {
		t.Fatalf("expected empty+truncated for max=0, got=%q truncated=%v", got, truncated)
	}
}

