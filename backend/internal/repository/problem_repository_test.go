package repository

import (
	"fmt"
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
	db, repo := newProblemRepositoryTest(t)
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

func TestProblemRepository_FindPageReturnsStablePageAndTotal(t *testing.T) {
	_, repo := newProblemRepositoryTest(t)
	for i := 0; i < 5; i++ {
		problem := &model.Problem{
			Title:        fmt.Sprintf("Problem %d", i),
			Description:  "description",
			Constraints:  "constraints",
			Difficulty:   model.DifficultyEasy,
			FunctionName: "solve",
			TimeLimit:    1000,
			MemoryLimit:  128,
			TestCases:    []model.TestCase{{Input: "[1]", ExpectedOutput: "1"}},
			IOSchema:     model.IOSchema{ParamTypes: []string{"int"}, ReturnType: "int"},
		}
		require.NoError(t, repo.Create(problem))
	}

	firstPage, total, err := repo.FindPage(0, 2)
	require.NoError(t, err)
	require.Equal(t, int64(5), total)
	require.Len(t, firstPage, 2)

	secondPage, total, err := repo.FindPage(2, 2)
	require.NoError(t, err)
	require.Equal(t, int64(5), total)
	require.Len(t, secondPage, 2)
	require.NotEqual(t, firstPage[0].ID, secondPage[0].ID)

	lastPage, total, err := repo.FindPage(4, 2)
	require.NoError(t, err)
	require.Equal(t, int64(5), total)
	require.Len(t, lastPage, 1)
}

func newProblemRepositoryTest(t *testing.T) (*gorm.DB, ProblemRepository) {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(
		&model.Problem{},
		&model.Example{},
		&model.TestCase{},
		&model.IOSchema{},
	))

	return db, NewProblemRepository(
		db,
		appLogger.NewZerologLogger(zerolog.New(io.Discard)),
	)
}

func requireTableCount(t *testing.T, db *gorm.DB, value any, expected int64) {
	t.Helper()
	var count int64
	require.NoError(t, db.Model(value).Count(&count).Error)
	require.Equal(t, expected, count)
}
