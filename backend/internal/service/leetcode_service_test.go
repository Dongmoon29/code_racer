package service

import (
	"errors"
	"testing"

	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/google/uuid"
	"github.com/rs/zerolog"
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

func setupLeetCodeServiceTest() (*MockLeetCodeRepository, *leetCodeService) {
	mockRepo := &MockLeetCodeRepository{}
	testLogger := logger.NewZerologLogger(zerolog.New(zerolog.NewConsoleWriter()).With().Caller().Logger())
	service := NewLeetCodeService(mockRepo, testLogger).(*leetCodeService)

	return mockRepo, service
}

func TestLeetCodeService_GetAllProblems(t *testing.T) {
	mockRepo, service := setupLeetCodeServiceTest()

	// 테스트 데이터 준비
	problems := []model.LeetCode{
		{
			ID:         uuid.New(),
			Title:      "Two Sum",
			Difficulty: "Easy",
		},
		{
			ID:         uuid.New(),
			Title:      "Add Two Numbers",
			Difficulty: "Medium",
		},
	}

	// 모의 리포지토리 설정
	mockRepo.On("FindAll").Return(problems, nil)

	// 서비스 메서드 호출
	result, err := service.GetAllProblems()

	// 결과 검증
	assert.NoError(t, err)
	assert.Len(t, result, 2)
	assert.Equal(t, "Two Sum", result[0].Title)
	assert.Equal(t, "Easy", string(result[0].Difficulty))

	// 모의 리포지토리 호출 확인
	mockRepo.AssertExpectations(t)
}

func TestLeetCodeService_GetAllProblems_Error(t *testing.T) {
	mockRepo, service := setupLeetCodeServiceTest()

	// 에러 상황 시뮬레이션
	expectedError := errors.New("database error")
	mockRepo.On("FindAll").Return([]model.LeetCode{}, expectedError)

	// 서비스 메서드 호출
	result, err := service.GetAllProblems()

	// 결과 검증
	assert.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "failed to fetch problems")

	// 모의 리포지토리 호출 확인
	mockRepo.AssertExpectations(t)
}

func TestLeetCodeService_GetProblemByID(t *testing.T) {
	mockRepo, service := setupLeetCodeServiceTest()

	// 테스트 데이터 준비
	problemID := uuid.New()
	problem := &model.LeetCode{
		ID:          problemID,
		Title:       "Two Sum",
		Difficulty:  "Easy",
		Description: "Given an array of integers...",
	}

	// 모의 리포지토리 설정
	mockRepo.On("FindByID", problemID).Return(problem, nil)

	// 서비스 메서드 호출
	result, err := service.GetProblemByID(problemID)

	// 결과 검증
	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, problemID, result.ID)
	assert.Equal(t, "Two Sum", result.Title)

	// 모의 리포지토리 호출 확인
	mockRepo.AssertExpectations(t)
}

func TestLeetCodeService_GetProblemByID_NotFound(t *testing.T) {
	mockRepo, service := setupLeetCodeServiceTest()

	// 문제를 찾을 수 없는 상황 시뮬레이션
	problemID := uuid.New()
	expectedError := errors.New("record not found")
	mockRepo.On("FindByID", problemID).Return(nil, expectedError)

	// 서비스 메서드 호출
	result, err := service.GetProblemByID(problemID)

	// 결과 검증
	assert.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "problem not found")

	// 모의 리포지토리 호출 확인
	mockRepo.AssertExpectations(t)
}

func TestLeetCodeService_CreateProblem(t *testing.T) {
	mockRepo, service := setupLeetCodeServiceTest()

	// 테스트 데이터 준비
	createReq := &model.CreateLeetCodeRequest{
		Title:              "New Problem",
		Description:        "Problem description",
		Examples:           "Example 1: ...",
		Constraints:        "1 <= n <= 100",
		Difficulty:         "Easy",
		InputFormat:        "array",
		OutputFormat:       "number",
		FunctionName:       "solve",
		JavaScriptTemplate: "function solve() {}",
		PythonTemplate:     "def solve(): pass",
		GoTemplate:         "func solve() {}",
		JavaTemplate:       "public int solve() {}",
		CPPTemplate:        "int solve() {}",
		TestCases: model.TestCases{
			{
				Input:  []interface{}{1, 2, 3},
				Output: 6,
			},
		},
		ExpectedOutputs: "6",
	}

	// 모의 리포지토리 설정
	mockRepo.On("Create", mock.AnythingOfType("*model.LeetCode")).Return(nil)

	// 서비스 메서드 호출
	result, err := service.CreateProblem(createReq)

	// 결과 검증
	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, "New Problem", result.Title)
	assert.Equal(t, "Easy", string(result.Difficulty))

	// 모의 리포지토리 호출 확인
	mockRepo.AssertExpectations(t)
}

func TestLeetCodeService_CreateProblem_InvalidTestCases(t *testing.T) {
	mockRepo, service := setupLeetCodeServiceTest()

	// 잘못된 테스트 케이스로 요청 생성
	createReq := &model.CreateLeetCodeRequest{
		Title:              "New Problem",
		Description:        "Problem description",
		Examples:           "Example 1: ...",
		Constraints:        "1 <= n <= 100",
		Difficulty:         "Easy",
		InputFormat:        "array",
		OutputFormat:       "number",
		FunctionName:       "solve",
		JavaScriptTemplate: "function solve() {}",
		PythonTemplate:     "def solve(): pass",
		GoTemplate:         "func solve() {}",
		JavaTemplate:       "public int solve() {}",
		CPPTemplate:        "int solve() {}",
		TestCases:          model.TestCases{}, // 빈 테스트 케이스
		ExpectedOutputs:    "6",
	}

	// 서비스 메서드 호출
	result, err := service.CreateProblem(createReq)

	// 결과 검증
	assert.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "at least one test case is required")

	// 모의 리포지토리가 호출되지 않았는지 확인
	mockRepo.AssertNotCalled(t, "Create")
}

func TestLeetCodeService_UpdateProblem(t *testing.T) {
	mockRepo, service := setupLeetCodeServiceTest()

	// 테스트 데이터 준비
	problemID := uuid.New()
	existingProblem := &model.LeetCode{
		ID:         problemID,
		Title:      "Old Title",
		Difficulty: "Easy",
	}

	updateReq := &model.UpdateLeetCodeRequest{
		Title:              "Updated Title",
		Description:        "Updated description",
		Examples:           "Updated examples",
		Constraints:        "1 <= n <= 1000",
		Difficulty:         "Medium",
		InputFormat:        "array",
		OutputFormat:       "number",
		FunctionName:       "solve",
		JavaScriptTemplate: "function solve() {}",
		PythonTemplate:     "def solve(): pass",
		GoTemplate:         "func solve() {}",
		JavaTemplate:       "public int solve() {}",
		CPPTemplate:        "int solve() {}",
		TestCases: model.TestCases{
			{
				Input:  []interface{}{1, 2, 3, 4},
				Output: 10,
			},
		},
		ExpectedOutputs: "10",
	}

	// 모의 리포지토리 설정
	mockRepo.On("FindByID", problemID).Return(existingProblem, nil)
	mockRepo.On("Update", mock.AnythingOfType("*model.LeetCode")).Return(nil)

	// 서비스 메서드 호출
	result, err := service.UpdateProblem(problemID, updateReq)

	// 결과 검증
	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, "Updated Title", result.Title)
	assert.Equal(t, "Medium", string(result.Difficulty))

	// 모의 리포지토리 호출 확인
	mockRepo.AssertExpectations(t)
}

func TestLeetCodeService_UpdateProblem_NotFound(t *testing.T) {
	mockRepo, service := setupLeetCodeServiceTest()

	// 문제를 찾을 수 없는 상황 시뮬레이션
	problemID := uuid.New()
	expectedError := errors.New("record not found")

	updateReq := &model.UpdateLeetCodeRequest{
		Title:      "Updated Title",
		Difficulty: "Medium",
		// ... 다른 필드들
	}

	// 모의 리포지토리 설정
	mockRepo.On("FindByID", problemID).Return(nil, expectedError)

	// 서비스 메서드 호출
	result, err := service.UpdateProblem(problemID, updateReq)

	// 결과 검증
	assert.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "problem not found")

	// 모의 리포지토리 호출 확인
	mockRepo.AssertExpectations(t)
}

func TestLeetCodeService_DeleteProblem(t *testing.T) {
	mockRepo, service := setupLeetCodeServiceTest()

	// 테스트 데이터 준비
	problemID := uuid.New()
	existingProblem := &model.LeetCode{
		ID:         problemID,
		Title:      "Problem to Delete",
		Difficulty: "Easy",
	}

	// 모의 리포지토리 설정
	mockRepo.On("FindByID", problemID).Return(existingProblem, nil)
	mockRepo.On("Delete", problemID).Return(nil)

	// 서비스 메서드 호출
	err := service.DeleteProblem(problemID)

	// 결과 검증
	assert.NoError(t, err)

	// 모의 리포지토리 호출 확인
	mockRepo.AssertExpectations(t)
}

func TestLeetCodeService_DeleteProblem_NotFound(t *testing.T) {
	mockRepo, service := setupLeetCodeServiceTest()

	// 문제를 찾을 수 없는 상황 시뮬레이션
	problemID := uuid.New()
	expectedError := errors.New("record not found")

	// 모의 리포지토리 설정
	mockRepo.On("FindByID", problemID).Return(nil, expectedError)

	// 서비스 메서드 호출
	err := service.DeleteProblem(problemID)

	// 결과 검증
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "problem not found")

	// 모의 리포지토리 호출 확인
	mockRepo.AssertExpectations(t)
}

func TestLeetCodeService_GetProblemsByDifficulty(t *testing.T) {
	mockRepo, service := setupLeetCodeServiceTest()

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
	mockRepo.On("FindByDifficulty", "Easy").Return(problems, nil)

	// 서비스 메서드 호출
	result, err := service.GetProblemsByDifficulty("Easy")

	// 결과 검증
	assert.NoError(t, err)
	assert.Len(t, result, 2)
	assert.Equal(t, "Easy Problem 1", result[0].Title)
	assert.Equal(t, "Easy", string(result[0].Difficulty))

	// 모의 리포지토리 호출 확인
	mockRepo.AssertExpectations(t)
}

func TestLeetCodeService_SearchProblems(t *testing.T) {
	mockRepo, service := setupLeetCodeServiceTest()

	// 테스트 데이터 준비
	problems := []model.LeetCode{
		{
			ID:         uuid.New(),
			Title:      "Two Sum Problem",
			Difficulty: "Easy",
		},
	}

	// 모의 리포지토리 설정
	mockRepo.On("Search", "Two Sum").Return(problems, nil)

	// 서비스 메서드 호출
	result, err := service.SearchProblems("Two Sum")

	// 결과 검증
	assert.NoError(t, err)
	assert.Len(t, result, 1)
	assert.Equal(t, "Two Sum Problem", result[0].Title)

	// 모의 리포지토리 호출 확인
	mockRepo.AssertExpectations(t)
}

func TestLeetCodeService_ValidateTestCases(t *testing.T) {
	_, service := setupLeetCodeServiceTest()

	// 유효한 테스트 케이스
	validTestCases := model.TestCases{
		{
			Input:  []interface{}{1, 2, 3},
			Output: 6,
		},
		{
			Input:  []interface{}{4, 5, 6},
			Output: 15,
		},
	}

	err := service.ValidateTestCases(validTestCases, "solve")
	assert.NoError(t, err)

	// 빈 테스트 케이스
	emptyTestCases := model.TestCases{}
	err = service.ValidateTestCases(emptyTestCases, "solve")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "at least one test case is required")

	// 입력이 없는 테스트 케이스
	invalidTestCases := model.TestCases{
		{
			Input:  []interface{}{},
			Output: 6,
		},
	}
	err = service.ValidateTestCases(invalidTestCases, "solve")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "input cannot be empty")

	// 출력이 nil인 테스트 케이스
	nilOutputTestCases := model.TestCases{
		{
			Input:  []interface{}{1, 2, 3},
			Output: nil,
		},
	}
	err = service.ValidateTestCases(nilOutputTestCases, "solve")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "output cannot be nil")
}
