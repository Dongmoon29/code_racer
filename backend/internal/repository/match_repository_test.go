package repository

import (
	"errors"
	"io"
	"testing"

	appLogger "github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/rs/zerolog"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func TestMatchRepository_SetWinner_StoresWinnerMetrics(t *testing.T) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	assert.NoError(t, err)

	// Minimal schema for SetWinner path
	err = db.AutoMigrate(&model.User{}, &model.Problem{}, &model.IOSchema{}, &model.Match{}, &model.ActiveMatchParticipant{})
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
		FunctionName: "twoSum",
		TimeLimit:    1000,
		MemoryLimit:  128,
	}
	assert.NoError(t, db.Create(&p).Error)

	schema := model.IOSchema{
		ProblemID:  p.ID,
		ParamTypes: []string{"int[]", "int"},
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
	memKB := 4567.333333333333
	language := "python"
	winnerCode := "def two_sum(nums, target):\n    return [0, 1]"

	assert.NoError(t, repo.SetWinner(m.ID, u.ID, winnerCode, language, execTime, memKB))

	var got model.Match
	assert.NoError(t, db.First(&got, "id = ?", m.ID).Error)
	assert.NotNil(t, got.WinnerID)
	assert.Equal(t, u.ID, *got.WinnerID)
	assert.Equal(t, model.MatchStatusFinished, got.Status)
	assert.NotNil(t, got.EndedAt)
	assert.InDelta(t, execTime, got.WinnerExecutionTimeSeconds, 1e-9)
	assert.Equal(t, 4567.0, got.WinnerMemoryUsageKB)
	assert.Equal(t, language, got.WinnerLanguage)
	assert.Equal(t, winnerCode, got.WinnerCode)
	assert.Equal(t, winnerCode, got.ToResponse().WinnerCode)
}

func TestMatchRepository_CreateExclusive_AllowsOnlyOneActiveMatchPerUser(t *testing.T) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(&model.User{}, &model.Problem{}, &model.Example{}, &model.TestCase{}, &model.IOSchema{}, &model.Match{}, &model.ActiveMatchParticipant{}))

	users := []model.User{{Email: "one@example.com", Name: "One"}, {Email: "two@example.com", Name: "Two"}, {Email: "three@example.com", Name: "Three"}}
	for i := range users {
		require.NoError(t, db.Create(&users[i]).Error)
	}
	problem := model.Problem{Title: "Problem", Description: "desc", Constraints: "none", Difficulty: model.DifficultyEasy, FunctionName: "solve", TimeLimit: 1000, MemoryLimit: 128}
	require.NoError(t, db.Create(&problem).Error)
	repo := NewMatchRepository(db, appLogger.NewZerologLogger(zerolog.New(io.Discard)))

	first := &model.Match{PlayerAID: users[0].ID, PlayerBID: &users[1].ID, ProblemID: problem.ID, Mode: model.MatchModeCasualPVP, Status: model.MatchStatusPlaying}
	require.NoError(t, repo.CreateExclusive(first))
	second := &model.Match{PlayerAID: users[0].ID, PlayerBID: &users[2].ID, ProblemID: problem.ID, Mode: model.MatchModeCasualPVP, Status: model.MatchStatusPlaying}
	require.ErrorIs(t, repo.CreateExclusive(second), ErrActiveMatchExists)

	active, err := repo.FindActiveByUserID(users[0].ID)
	require.NoError(t, err)
	assert.Equal(t, first.ID, active.ID)
	var matchCount int64
	require.NoError(t, db.Model(&model.Match{}).Count(&matchCount).Error)
	assert.EqualValues(t, 1, matchCount, "the rejected match transaction must roll back")
}

func TestMatchRepository_FinishDraw_ReleasesActiveParticipants(t *testing.T) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(&model.User{}, &model.Problem{}, &model.Example{}, &model.TestCase{}, &model.IOSchema{}, &model.Match{}, &model.ActiveMatchParticipant{}))
	user := model.User{Email: "draw@example.com", Name: "Draw"}
	require.NoError(t, db.Create(&user).Error)
	problem := model.Problem{Title: "Problem", Description: "desc", Constraints: "none", Difficulty: model.DifficultyEasy, FunctionName: "solve", TimeLimit: 1000, MemoryLimit: 128}
	require.NoError(t, db.Create(&problem).Error)
	repo := NewMatchRepository(db, appLogger.NewZerologLogger(zerolog.New(io.Discard)))
	match := &model.Match{PlayerAID: user.ID, ProblemID: problem.ID, Mode: model.MatchModeCasualPVP, Status: model.MatchStatusPlaying}
	require.NoError(t, repo.CreateExclusive(match))

	finished, err := repo.FinishDraw(match.ID)
	require.NoError(t, err)
	assert.True(t, finished)
	got, err := repo.FindByID(match.ID)
	require.NoError(t, err)
	assert.Equal(t, model.MatchStatusFinished, got.Status)
	assert.Nil(t, got.WinnerID)
	assert.NotNil(t, got.EndedAt)
	_, err = repo.FindActiveByUserID(user.ID)
	assert.True(t, errors.Is(err, gorm.ErrRecordNotFound))
}
