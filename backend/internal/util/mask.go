package util

import (
	"strings"
)

// MaskSensitiveInfo masks sensitive information in strings
func MaskSensitiveInfo(s string, visibleChars int) string {
	if len(s) == 0 {
		return ""
	}
	if len(s) <= visibleChars {
		return strings.Repeat("*", len(s))
	}
	return s[:visibleChars] + strings.Repeat("*", len(s)-visibleChars)
}

// MaskToken masks JWT tokens, showing only first few characters
func MaskToken(token string) string {
	return MaskSensitiveInfo(token, 10)
}

// MaskCode masks code snippets, showing only first few characters
func MaskCode(code string) string {
	return MaskSensitiveInfo(code, 20)
}
