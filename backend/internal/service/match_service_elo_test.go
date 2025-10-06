package service

import (
	"math"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestApplyElo_WinnerHigherRating(t *testing.T) {
	// Winner has higher rating; gain should be relatively small
	winnerOld := 1600
	loserOld := 1500

	winnerNew, loserNew := applyElo(winnerOld, loserOld, true)

	// Basic invariants
	assert.Greater(t, winnerNew, winnerOld)
	assert.Less(t, loserNew, loserOld)

	// Conservation in expectation: total rating drift should be bounded by K
	totalDrift := (winnerNew - winnerOld) + (loserNew - loserOld)
	assert.LessOrEqual(t, int(math.Abs(float64(totalDrift))), 32)
}

func TestApplyElo_WinnerLowerRating(t *testing.T) {
	// Winner is underdog; gain should be higher
	winnerOld := 1400
	loserOld := 1700

	winnerNew, loserNew := applyElo(winnerOld, loserOld, true)

	assert.Greater(t, winnerNew, winnerOld)
	assert.Less(t, loserNew, loserOld)

	// Underdog should gain >= around 20 with K=32 typically
	assert.GreaterOrEqual(t, winnerNew-winnerOld, 20)
}

func TestApplyElo_NoNegativeRatings(t *testing.T) {
	// Extreme edge: ensure ratings don't go negative
	winnerOld := 0
	loserOld := 0

	// If winner loses (simulate by winnerWon=false), rating shouldn't go below 0
	a, b := applyElo(winnerOld, loserOld, false)
	assert.GreaterOrEqual(t, a, 0)
	assert.GreaterOrEqual(t, b, 0)
}
