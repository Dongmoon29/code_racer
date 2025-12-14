package repository

import (
	"io"
	"testing"

	appLogger "github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/rs/zerolog"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func TestMatchRepository_SetWinner_StoresWinnerMetrics(t *testing.T) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	assert.NoError(t, err)

	// Minimal schema for SetWinner path
	err = db.AutoMigrate(&model.User{}, &model.Problem{}, &model.IOSchema{}, &model.Match{})
	assert.NoError(t, err)

	u := model.User{
		Email: "a@example.com",
		Name:  "A",
	}
	assert.NoError(t, db.Create(&u).Error)

	p := model.Problem{
		Title:        "Two Sum",
		Description:  "desc",
		Constraints:  "constraints",
		Difficulty:   model.DifficultyEasy,
		InputFormat:  "array,number",
		OutputFormat: "array",
		FunctionName: "twoSum",
		TimeLimit:    1000,
		MemoryLimit:  128,
	}
	assert.NoError(t, db.Create(&p).Error)

	schema := model.IOSchema{
		ProblemID:  p.ID,
		ParamTypes: `["int[]","int"]`,
		ReturnType: "int[]",
	}
	assert.NoError(t, db.Create(&schema).Error)

	m := model.Match{
		PlayerAID: u.ID,
		ProblemID: p.ID,
		Mode:      model.MatchModeSingle,
		Status:    model.MatchStatusPlaying,
	}
	assert.NoError(t, db.Create(&m).Error)

	zl := zerolog.New(io.Discard)
	repo := NewMatchRepository(db, appLogger.NewZerologLogger(zl))

	execTime := 0.123
	memKB := 4567.0

	assert.NoError(t, repo.SetWinner(m.ID, u.ID, execTime, memKB))

	var got model.Match
	assert.NoError(t, db.First(&got, "id = ?", m.ID).Error)
	assert.NotNil(t, got.WinnerID)
	assert.Equal(t, u.ID, *got.WinnerID)
	assert.Equal(t, model.MatchStatusFinished, got.Status)
	assert.NotNil(t, got.EndedAt)
	assert.InDelta(t, execTime, got.WinnerExecutionTimeSeconds, 1e-9)
	assert.InDelta(t, memKB, got.WinnerMemoryUsageKB, 1e-9)
}

