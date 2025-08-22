package repository

import (
	"testing"

	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockLeetCodeRepository는 테스트를 위한 LeetCodeRepository 모의 객체
type MockLeetCodeRepository struct {
	mock.Mock
}

func (m *MockLeetCodeRepository) FindAll() ([]model.LeetCode, error) {
	args := m.Called()
	return args.Get(0).([]model.LeetCode), args.Error(1)
}

func (m *MockLeetCodeRepository) FindByID(id uuid.UUID) (*model.LeetCode, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.LeetCode), args.Error(1)
}

func (m *MockLeetCodeRepository) Create(leetcode *model.LeetCode) error {
	args := m.Called(leetcode)
	return args.Error(0)
}

func (m *MockLeetCodeRepository) Update(leetcode *model.LeetCode) error {
	args := m.Called(leetcode)
	return args.Error(0)
}

func (m *MockLeetCodeRepository) Delete(id uuid.UUID) error {
	args := m.Called(id)
	return args.Error(0)
}

func (m *MockLeetCodeRepository) FindByDifficulty(difficulty string) ([]model.LeetCode, error) {
	args := m.Called(difficulty)
	return args.Get(0).([]model.LeetCode), args.Error(1)
}

func (m *MockLeetCodeRepository) Search(query string) ([]model.LeetCode, error) {
	args := m.Called(query)
	return args.Get(0).([]model.LeetCode), args.Error(1)
}

func setupLeetCodeRepositoryTest() *MockLeetCodeRepository {
	return &MockLeetCodeRepository{}
}

func TestLeetCodeRepository_Create(t *testing.T) {
	repo := setupLeetCodeRepositoryTest()

	// 테스트 데이터 준비
	problem := &model.LeetCode{
		Title:       "Test Problem",
		Description: "Test description",
		Examples:    "Example 1: ...",
		Constraints: "1 <= n <= 100",
		TestCases: model.TestCases{
			{
				Input:  []interface{}{1, 2, 3},
				Output: 6,
			},
		},
		ExpectedOutputs:    "6",
		Difficulty:         "Easy",
		InputFormat:        "array",
		OutputFormat:       "number",
		FunctionName:       "solve",
		JavaScriptTemplate: "function solve() {}",
		PythonTemplate:     "def solve(): pass",
		GoTemplate:         "func solve() {}",
		JavaTemplate:       "public int solve() {}",
		CPPTemplate:        "int solve() {}",
		TimeLimit:          1000,
		MemoryLimit:        128,
	}

	// 모의 리포지토리 설정
	repo.On("Create", problem).Return(nil)

	// 문제 생성
	err := repo.Create(problem)
	assert.NoError(t, err)

	// 모의 리포지토리 호출 확인
	repo.AssertExpectations(t)
}

func TestLeetCodeRepository_FindByID(t *testing.T) {
	repo := setupLeetCodeRepositoryTest()

	// 테스트 데이터 준비
	problemID := uuid.New()
	problem := &model.LeetCode{
		ID:          problemID,
		Title:       "Find Test Problem",
		Description: "Test description",
		Difficulty:  "Medium",
	}

	// 모의 리포지토리 설정
	repo.On("FindByID", problemID).Return(problem, nil)

	// ID로 조회
	found, err := repo.FindByID(problemID)
	assert.NoError(t, err)
	assert.Equal(t, problem.ID, found.ID)
	assert.Equal(t, "Find Test Problem", found.Title)
	assert.Equal(t, "Medium", found.Difficulty)

	// 모의 리포지토리 호출 확인
	repo.AssertExpectations(t)
}

func TestLeetCodeRepository_FindByID_NotFound(t *testing.T) {
	repo := setupLeetCodeRepositoryTest()

	// 존재하지 않는 ID로 조회
	nonExistentID := uuid.New()

	// 모의 리포지토리 설정
	repo.On("FindByID", nonExistentID).Return(nil, assert.AnError)

	found, err := repo.FindByID(nonExistentID)

	assert.Error(t, err)
	assert.Nil(t, found)

	// 모의 리포지토리 호출 확인
	repo.AssertExpectations(t)
}

func TestLeetCodeRepository_FindAll(t *testing.T) {
	repo := setupLeetCodeRepositoryTest()

	// 테스트 데이터 준비
	problems := []model.LeetCode{
		{
			ID:         uuid.New(),
			Title:      "Problem 1",
			Difficulty: "Easy",
		},
		{
			ID:         uuid.New(),
			Title:      "Problem 2",
			Difficulty: "Hard",
		},
	}

	// 모의 리포지토리 설정
	repo.On("FindAll").Return(problems, nil)

	// 모든 문제 조회
	found, err := repo.FindAll()
	assert.NoError(t, err)
	assert.Len(t, found, 2)

	// 모의 리포지토리 호출 확인
	repo.AssertExpectations(t)
}

func TestLeetCodeRepository_Update(t *testing.T) {
	repo := setupLeetCodeRepositoryTest()

	// 테스트 데이터 준비
	problem := &model.LeetCode{
		ID:         uuid.New(),
		Title:      "Updated Test Problem",
		Difficulty: "Medium",
	}

	// 모의 리포지토리 설정
	repo.On("Update", problem).Return(nil)

	// 문제 업데이트
	err := repo.Update(problem)
	assert.NoError(t, err)

	// 모의 리포지토리 호출 확인
	repo.AssertExpectations(t)
}

func TestLeetCodeRepository_Delete(t *testing.T) {
	repo := setupLeetCodeRepositoryTest()

	// 테스트 데이터 준비
	problemID := uuid.New()

	// 모의 리포지토리 설정
	repo.On("Delete", problemID).Return(nil)

	// 문제 삭제
	err := repo.Delete(problemID)
	assert.NoError(t, err)

	// 모의 리포지토리 호출 확인
	repo.AssertExpectations(t)
}

func TestLeetCodeRepository_FindByDifficulty(t *testing.T) {
	repo := setupLeetCodeRepositoryTest()

	// 테스트 데이터 준비
	problems := []model.LeetCode{
		{
			ID:         uuid.New(),
			Title:      "Easy Problem 1",
			Difficulty: "Easy",
		},
		{
			ID:         uuid.New(),
			Title:      "Easy Problem 2",
			Difficulty: "Easy",
		},
	}

	// 모의 리포지토리 설정
	repo.On("FindByDifficulty", "Easy").Return(problems, nil)

	// Easy 난이도 문제만 조회
	found, err := repo.FindByDifficulty("Easy")
	assert.NoError(t, err)
	assert.Len(t, found, 2)

	// 모든 문제가 Easy 난이도인지 확인
	for _, problem := range found {
		assert.Equal(t, "Easy", problem.Difficulty)
	}

	// 모의 리포지토리 호출 확인
	repo.AssertExpectations(t)
}

func TestLeetCodeRepository_Search(t *testing.T) {
	repo := setupLeetCodeRepositoryTest()

	// 테스트 데이터 준비
	problems := []model.LeetCode{
		{
			ID:          uuid.New(),
			Title:       "Two Sum Problem",
			Description: "Find two numbers that add up to target",
			Difficulty:  "Easy",
		},
		{
			ID:          uuid.New(),
			Title:       "Add Numbers",
			Description: "Add two numbers together",
			Difficulty:  "Medium",
		},
	}

	// 모의 리포지토리 설정
	repo.On("Search", "Two Sum").Return(problems[:1], nil)
	repo.On("Search", "Add").Return(problems[1:], nil)
	repo.On("Search", "Problem").Return(problems, nil)
	repo.On("Search", "NonExistent").Return([]model.LeetCode{}, nil)

	// "Two Sum"으로 검색
	found, err := repo.Search("Two Sum")
	assert.NoError(t, err)
	assert.Len(t, found, 1)
	assert.Equal(t, "Two Sum Problem", found[0].Title)

	// "Add"로 검색
	found, err = repo.Search("Add")
	assert.NoError(t, err)
	assert.Len(t, found, 1)
	assert.Equal(t, "Add Numbers", found[0].Title)

	// "Problem"으로 검색 (두 문제 모두 포함)
	found, err = repo.Search("Problem")
	assert.NoError(t, err)
	assert.Len(t, found, 2)

	// 존재하지 않는 검색어
	found, err = repo.Search("NonExistent")
	assert.NoError(t, err)
	assert.Len(t, found, 0)

	// 모의 리포지토리 호출 확인
	repo.AssertExpectations(t)
}
