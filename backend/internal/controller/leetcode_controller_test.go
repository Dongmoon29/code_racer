package controller

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/rs/zerolog"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockLeetCodeService는 테스트를 위한 LeetCodeService 모의 객체
type MockLeetCodeService struct {
	mock.Mock
}

func (m *MockLeetCodeService) GetAllProblems() ([]*model.LeetCodeSummary, error) {
	args := m.Called()
	return args.Get(0).([]*model.LeetCodeSummary), args.Error(1)
}

func (m *MockLeetCodeService) GetProblemByID(id uuid.UUID) (*model.LeetCodeDetail, error) {
	args := m.Called(id)
	return args.Get(0).(*model.LeetCodeDetail), args.Error(1)
}

func (m *MockLeetCodeService) CreateProblem(req *model.CreateLeetCodeRequest) (*model.LeetCodeDetail, error) {
	args := m.Called(req)
	return args.Get(0).(*model.LeetCodeDetail), args.Error(1)
}

func (m *MockLeetCodeService) UpdateProblem(id uuid.UUID, req *model.UpdateLeetCodeRequest) (*model.LeetCodeDetail, error) {
	args := m.Called(id, req)
	return args.Get(0).(*model.LeetCodeDetail), args.Error(1)
}

func (m *MockLeetCodeService) DeleteProblem(id uuid.UUID) error {
	args := m.Called(id)
	return args.Error(0)
}

func (m *MockLeetCodeService) GetProblemsByDifficulty(difficulty string) ([]*model.LeetCodeSummary, error) {
	args := m.Called(difficulty)
	return args.Get(0).([]*model.LeetCodeSummary), args.Error(1)
}

func (m *MockLeetCodeService) SearchProblems(query string) ([]*model.LeetCodeSummary, error) {
	args := m.Called(query)
	return args.Get(0).([]*model.LeetCodeSummary), args.Error(1)
}

func (m *MockLeetCodeService) ValidateTestCases(testCases model.TestCases, schema model.IOSchema) error {
	args := m.Called(testCases, schema)
	return args.Error(0)
}

func setupLeetCodeControllerTest() (*gin.Engine, *MockLeetCodeService, *LeetCodeController) {
	gin.SetMode(gin.TestMode)
	router := gin.New()

	mockService := &MockLeetCodeService{}
	testLogger := logger.NewZerologLogger(zerolog.New(zerolog.NewConsoleWriter()).With().Caller().Logger())
	controller := NewLeetCodeController(mockService, testLogger)

	return router, mockService, controller
}

func TestLeetCodeController_GetAllProblems(t *testing.T) {
	router, mockService, controller := setupLeetCodeControllerTest()

	// 테스트 데이터 준비
	problems := []*model.LeetCodeSummary{
		{
			ID:         uuid.New(),
			Title:      "Two Sum",
			Difficulty: model.DifficultyEasy,
		},
		{
			ID:         uuid.New(),
			Title:      "Add Two Numbers",
			Difficulty: model.DifficultyMedium,
		},
	}

	// 모의 서비스 설정
	mockService.On("GetAllProblems").Return(problems, nil)

	// 라우터 설정
	router.GET("/problems", controller.GetAllProblems)

	// 요청 생성
	req, _ := http.NewRequest("GET", "/problems", nil)
	w := httptest.NewRecorder()

	// 요청 실행
	router.ServeHTTP(w, req)

	// 응답 검증
	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response["success"].(bool))

	// 모의 서비스 호출 확인
	mockService.AssertExpectations(t)
}

func TestLeetCodeController_GetProblemByID(t *testing.T) {
	router, mockService, controller := setupLeetCodeControllerTest()

	// 테스트 데이터 준비
	problemID := uuid.New()
	problem := &model.LeetCodeDetail{
		ID:          problemID,
		Title:       "Two Sum",
		Difficulty:  model.DifficultyEasy,
		Description: "Given an array of integers...",
	}

	// 모의 서비스 설정
	mockService.On("GetProblemByID", problemID).Return(problem, nil)

	// 라우터 설정
	router.GET("/problems/:id", controller.GetProblemByID)

	// 요청 생성
	req, _ := http.NewRequest("GET", "/problems/"+problemID.String(), nil)
	w := httptest.NewRecorder()

	// 요청 실행
	router.ServeHTTP(w, req)

	// 응답 검증
	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response["success"].(bool))

	// 모의 서비스 호출 확인
	mockService.AssertExpectations(t)
}

func TestLeetCodeController_CreateProblem(t *testing.T) {
	router, mockService, controller := setupLeetCodeControllerTest()

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
		IOSchema:        model.IOSchema{ParamTypes: []string{"number", "number", "number"}, ReturnType: "number"},
	}

	createdProblem := &model.LeetCodeDetail{
		ID:         uuid.New(),
		Title:      "New Problem",
		Difficulty: model.DifficultyEasy,
	}

	// 모의 서비스 설정 - 타입 검증을 완화하여 JSON 파싱 결과와 일치
	mockService.On("CreateProblem", mock.AnythingOfType("*model.CreateLeetCodeRequest")).Return(createdProblem, nil)

	// 라우터 설정
	router.POST("/problems", controller.CreateProblem)

	// 요청 본문 생성
	reqBody, _ := json.Marshal(createReq)
	req, _ := http.NewRequest("POST", "/problems", bytes.NewBuffer(reqBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	// 요청 실행
	router.ServeHTTP(w, req)

	// 응답 검증
	assert.Equal(t, http.StatusCreated, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response["success"].(bool))

	// 모의 서비스 호출 확인
	mockService.AssertExpectations(t)
}

func TestLeetCodeController_CreateProblem_InvalidDifficulty(t *testing.T) {
	router, _, controller := setupLeetCodeControllerTest()

	// 잘못된 난이도로 요청 생성
	createReq := &model.CreateLeetCodeRequest{
		Title:              "New Problem",
		Description:        "Problem description",
		Examples:           "Example 1: ...",
		Constraints:        "1 <= n <= 100",
		Difficulty:         "Invalid", // 잘못된 난이도
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

	// 라우터 설정
	router.POST("/problems", controller.CreateProblem)

	// 요청 본문 생성
	reqBody, _ := json.Marshal(createReq)
	req, _ := http.NewRequest("POST", "/problems", bytes.NewBuffer(reqBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	// 요청 실행
	router.ServeHTTP(w, req)

	// 응답 검증 - 400 Bad Request가 반환되어야 함
	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response["success"].(bool))
}

func TestLeetCodeController_UpdateProblem(t *testing.T) {
	router, mockService, controller := setupLeetCodeControllerTest()

	// 테스트 데이터 준비
	problemID := uuid.New()
	updateReq := &model.UpdateLeetCodeRequest{
		Title:              "Updated Problem",
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
		IOSchema:        model.IOSchema{ParamTypes: []string{"number", "number", "number", "number"}, ReturnType: "number"},
	}

	updatedProblem := &model.LeetCodeDetail{
		ID:         problemID,
		Title:      "Updated Problem",
		Difficulty: model.DifficultyMedium,
	}

	// 모의 서비스 설정 - 타입 검증을 완화하여 JSON 파싱 결과와 일치
	mockService.On("UpdateProblem", problemID, mock.AnythingOfType("*model.UpdateLeetCodeRequest")).Return(updatedProblem, nil)

	// 라우터 설정
	router.PUT("/problems/:id", controller.UpdateProblem)

	// 요청 본문 생성
	reqBody, _ := json.Marshal(updateReq)
	req, _ := http.NewRequest("PUT", "/problems/"+problemID.String(), bytes.NewBuffer(reqBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	// 요청 실행
	router.ServeHTTP(w, req)

	// 응답 검증
	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response["success"].(bool))

	// 모의 서비스 호출 확인
	mockService.AssertExpectations(t)
}

func TestLeetCodeController_DeleteProblem(t *testing.T) {
	router, mockService, controller := setupLeetCodeControllerTest()

	// 테스트 데이터 준비
	problemID := uuid.New()

	// 모의 서비스 설정
	mockService.On("DeleteProblem", problemID).Return(nil)

	// 라우터 설정
	router.DELETE("/problems/:id", controller.DeleteProblem)

	// 요청 생성
	req, _ := http.NewRequest("DELETE", "/problems/"+problemID.String(), nil)
	w := httptest.NewRecorder()

	// 요청 실행
	router.ServeHTTP(w, req)

	// 응답 검증
	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response["success"].(bool))

	// 모의 서비스 호출 확인
	mockService.AssertExpectations(t)
}

func TestLeetCodeController_GetProblemsByDifficulty(t *testing.T) {
	router, mockService, controller := setupLeetCodeControllerTest()

	// 테스트 데이터 준비
	problems := []*model.LeetCodeSummary{
		{
			ID:         uuid.New(),
			Title:      "Easy Problem 1",
			Difficulty: model.DifficultyEasy,
		},
		{
			ID:         uuid.New(),
			Title:      "Easy Problem 2",
			Difficulty: model.DifficultyEasy,
		},
	}

	// 모의 서비스 설정
	mockService.On("GetProblemsByDifficulty", "Easy").Return(problems, nil)

	// 라우터 설정
	router.GET("/problems/difficulty", controller.GetProblemsByDifficulty)

	// 요청 생성
	req, _ := http.NewRequest("GET", "/problems/difficulty?difficulty=Easy", nil)
	w := httptest.NewRecorder()

	// 요청 실행
	router.ServeHTTP(w, req)

	// 응답 검증
	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response["success"].(bool))

	// 모의 서비스 호출 확인
	mockService.AssertExpectations(t)
}

func TestLeetCodeController_SearchProblems(t *testing.T) {
	router, mockService, controller := setupLeetCodeControllerTest()

	// 테스트 데이터 준비
	problems := []*model.LeetCodeSummary{
		{
			ID:         uuid.New(),
			Title:      "Two Sum Problem",
			Difficulty: model.DifficultyEasy,
		},
	}

	// 모의 서비스 설정
	mockService.On("SearchProblems", "Two Sum").Return(problems, nil)

	// 라우터 설정
	router.GET("/problems/search", controller.SearchProblems)

	// 요청 생성
	req, _ := http.NewRequest("GET", "/problems/search?q=Two Sum", nil)
	w := httptest.NewRecorder()

	// 요청 실행
	router.ServeHTTP(w, req)

	// 응답 검증
	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response["success"].(bool))

	// 모의 서비스 호출 확인
	mockService.AssertExpectations(t)
}

func TestLeetCodeController_GetProblemsWithPagination(t *testing.T) {
	router, mockService, controller := setupLeetCodeControllerTest()

	// 테스트 데이터 준비
	problems := []*model.LeetCodeSummary{
		{
			ID:         uuid.New(),
			Title:      "Problem 1",
			Difficulty: model.DifficultyEasy,
		},
		{
			ID:         uuid.New(),
			Title:      "Problem 2",
			Difficulty: model.DifficultyMedium,
		},
	}

	// 모의 서비스 설정
	mockService.On("GetAllProblems").Return(problems, nil)

	// 라우터 설정
	router.GET("/problems/page", controller.GetProblemsWithPagination)

	// 요청 생성
	req, _ := http.NewRequest("GET", "/problems/page?page=1&limit=10", nil)
	w := httptest.NewRecorder()

	// 요청 실행
	router.ServeHTTP(w, req)

	// 응답 검증
	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response["success"].(bool))

	// 페이지네이션 정보 확인
	pagination := response["pagination"].(map[string]interface{})
	assert.Equal(t, float64(1), pagination["page"])
	assert.Equal(t, float64(10), pagination["limit"])
	assert.Equal(t, float64(2), pagination["total"])

	// 모의 서비스 호출 확인
	mockService.AssertExpectations(t)
}

func TestIsValidDifficulty(t *testing.T) {
	// 유효한 난이도 테스트
	assert.True(t, isValidDifficulty("Easy"))
	assert.True(t, isValidDifficulty("Medium"))
	assert.True(t, isValidDifficulty("Hard"))

	// 유효하지 않은 난이도 테스트
	assert.False(t, isValidDifficulty("easy"))
	assert.False(t, isValidDifficulty("MEDIUM"))
	assert.False(t, isValidDifficulty(""))
	assert.False(t, isValidDifficulty("Invalid"))
}
