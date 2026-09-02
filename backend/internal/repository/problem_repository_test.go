package repository

import (
	"io"
	"testing"

	appLogger "github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/rs/zerolog"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func TestProblemRepository_CreateAndUpdateReplaceRelationsOnce(t *testing.T) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(
		&model.Problem{},
		&model.Example{},
		&model.TestCase{},
		&model.IOSchema{},
	))

	repo := NewProblemRepository(
		db,
		appLogger.NewZerologLogger(zerolog.New(io.Discard)),
	)
	problem := &model.Problem{
		Title:        "Example",
		Description:  "description",
		Constraints:  "constraints",
		Difficulty:   model.DifficultyEasy,
		FunctionName: "solve",
		TimeLimit:    1000,
		MemoryLimit:  128,
		Examples: []model.Example{
			{Input: "1", Output: "1"},
		},
		TestCases: []model.TestCase{
			{Input: "[1]", ExpectedOutput: "1"},
			{Input: "[2]", ExpectedOutput: "2"},
		},
		IOSchema: model.IOSchema{
			ParamTypes: []string{"int"},
			ReturnType: "int",
		},
	}

	require.NoError(t, repo.Create(problem))
	requireTableCount(t, db, &model.Example{}, 1)
	requireTableCount(t, db, &model.TestCase{}, 2)
	requireTableCount(t, db, &model.IOSchema{}, 1)

	problem.Examples = []model.Example{
		{Input: "3", Output: "3"},
		{Input: "4", Output: "4"},
	}
	problem.TestCases = []model.TestCase{
		{Input: "[3]", ExpectedOutput: "3"},
	}
	problem.IOSchema = model.IOSchema{
		ParamTypes: []string{"int"},
		ReturnType: "int",
	}

	require.NoError(t, repo.Update(problem))
	requireTableCount(t, db, &model.Example{}, 2)
	requireTableCount(t, db, &model.TestCase{}, 1)
	requireTableCount(t, db, &model.IOSchema{}, 1)
}

func requireTableCount(t *testing.T, db *gorm.DB, value any, expected int64) {
	t.Helper()
	var count int64
	require.NoError(t, db.Model(value).Count(&count).Error)
	require.Equal(t, expected, count)
}
