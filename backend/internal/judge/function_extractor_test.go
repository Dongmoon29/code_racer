package judge

import (
	"io"
	"testing"

	"github.com/rs/zerolog"
	"github.com/stretchr/testify/require"
)

func TestValidateExpectedFunction_AllowsHelpersBeforeEntryFunction(t *testing.T) {
	log := zerolog.New(io.Discard)
	extractor := NewFunctionExtractor(&log)

	tests := []struct {
		language string
		code     string
	}{
		{"go", "func helper() {}\nfunc twoSum(nums []int, target int) []int { return nil }"},
		{"python", "def helper():\n    pass\n\ndef twoSum(nums, target):\n    return []"},
		{"javascript", "function helper() {}\nconst twoSum = (nums, target) => [];"},
	}
	for _, test := range tests {
		t.Run(test.language, func(t *testing.T) {
			require.NoError(t, extractor.ValidateExpectedFunction(test.code, test.language, "twoSum"))
		})
	}
}

func TestValidateExpectedFunction_RejectsMissingEntryFunction(t *testing.T) {
	log := zerolog.New(io.Discard)
	extractor := NewFunctionExtractor(&log)
	require.Error(t, extractor.ValidateExpectedFunction("def helper():\n    pass", "python", "twoSum"))
}
