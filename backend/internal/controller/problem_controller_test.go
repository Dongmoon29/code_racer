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

// MockProblemService is a mock object for ProblemService for testing
type MockProblemService struct {
	mock.Mock
}

func (m *MockProblemService) GetAllProblems() ([]*model.ProblemSummary, error) {
	args := m.Called()
	return args.Get(0).([]*model.ProblemSummary), args.Error(1)
}

func (m *MockProblemService) GetProblemByID(id uuid.UUID) (*model.ProblemDetail, error) {
	args := m.Called(id)
	return args.Get(0).(*model.ProblemDetail), args.Error(1)
}

func (m *MockProblemService) CreateProblem(req *model.CreateProblemRequest) (*model.ProblemDetail, error) {
	args := m.Called(req)
	return args.Get(0).(*model.ProblemDetail), args.Error(1)
}

func (m *MockProblemService) UpdateProblem(id uuid.UUID, req *model.UpdateProblemRequest) (*model.ProblemDetail, error) {
	args := m.Called(id, req)
	return args.Get(0).(*model.ProblemDetail), args.Error(1)
}

func (m *MockProblemService) DeleteProblem(id uuid.UUID) error {
	args := m.Called(id)
	return args.Error(0)
}

func (m *MockProblemService) GetProblemsByDifficulty(difficulty string) ([]*model.ProblemSummary, error) {
	args := m.Called(difficulty)
	return args.Get(0).([]*model.ProblemSummary), args.Error(1)
}

func (m *MockProblemService) SearchProblems(query string) ([]*model.ProblemSummary, error) {
	args := m.Called(query)
	return args.Get(0).([]*model.ProblemSummary), args.Error(1)
}

func (m *MockProblemService) ValidateTestCases(testCases []model.CreateTestCaseRequest, schema model.CreateIOSchemaRequest) error {
	args := m.Called(testCases, schema)
	return args.Error(0)
}

func setupProblemControllerTest() (*gin.Engine, *MockProblemService, *ProblemController) {
	gin.SetMode(gin.TestMode)
	router := gin.New()

	mockService := &MockProblemService{}
	testLogger := logger.NewZerologLogger(zerolog.New(zerolog.NewConsoleWriter()).With().Caller().Logger())
	controller := NewProblemController(mockService, testLogger)

	return router, mockService, controller
}

func TestProblemController_GetAllProblems(t *testing.T) {
	router, mockService, controller := setupProblemControllerTest()

	// 테스트 데이터 준비
	problems := []*model.ProblemSummary{
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
	// unified format returns list under data
	assert.NotNil(t, response["data"])

	// 모의 서비스 호출 확인
	mockService.AssertExpectations(t)
}

func TestProblemController_GetProblemByID(t *testing.T) {
	router, mockService, controller := setupProblemControllerTest()

	// 테스트 데이터 준비
	problemID := uuid.New()
	problem := &model.ProblemDetail{
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
	assert.NotNil(t, response["data"])

	// 모의 서비스 호출 확인
	mockService.AssertExpectations(t)
}

func TestProblemController_CreateProblem(t *testing.T) {
	router, mockService, controller := setupProblemControllerTest()

	// 테스트 데이터 준비
	createReq := &model.CreateProblemRequest{
		Title:        "New Problem",
		Description:  "Problem description",
		Constraints:  "1 <= n <= 100",
		Difficulty:   "Easy",
		InputFormat:  "array",
		OutputFormat: "number",
		FunctionName: "solve",
		TimeLimit:    1000,
		MemoryLimit:  128,
		Examples: []model.CreateExampleRequest{
			{
				Input:       "Example 1: ...",
				Output:      "Expected output",
				Explanation: "Explanation",
			},
		},
		TestCases: []model.CreateTestCaseRequest{
			{
				Input:          `[1, 2, 3]`,
				ExpectedOutput: "6",
			},
		},
		IOTemplates: []model.CreateIOTemplateRequest{
			{
				Language: "javascript",
				Code:     "function solve() {}",
			},
		},
		IOSchema: model.CreateIOSchemaRequest{
			ParamTypes: []string{"number", "number", "number"},
			ReturnType: "number",
		},
	}

	createdProblem := &model.ProblemDetail{
		ID:         uuid.New(),
		Title:      "New Problem",
		Difficulty: model.DifficultyEasy,
	}

	// 모의 서비스 설정 - 타입 검증을 완화하여 JSON 파싱 결과와 일치
	mockService.On("CreateProblem", mock.AnythingOfType("*model.CreateProblemRequest")).Return(createdProblem, nil)

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
	assert.NotNil(t, response["data"])

	// 모의 서비스 호출 확인
	mockService.AssertExpectations(t)
}

func TestProblemController_CreateProblem_InvalidDifficulty(t *testing.T) {
	router, _, controller := setupProblemControllerTest()

	// 잘못된 난이도로 요청 생성
	createReq := &model.CreateProblemRequest{
		Title:        "New Problem",
		Description:  "Problem description",
		Constraints:  "1 <= n <= 100",
		Difficulty:   "Invalid", // 잘못된 난이도
		InputFormat:  "array",
		OutputFormat: "number",
		FunctionName: "solve",
		TimeLimit:    1000,
		MemoryLimit:  128,
		Examples: []model.CreateExampleRequest{
			{
				Input:       "Example 1: ...",
				Output:      "Expected output",
				Explanation: "Explanation",
			},
		},
		TestCases: []model.CreateTestCaseRequest{
			{
				Input:          `[1, 2, 3]`,
				ExpectedOutput: "6",
			},
		},
		IOTemplates: []model.CreateIOTemplateRequest{
			{
				Language: "javascript",
				Code:     "function solve() {}",
			},
		},
		IOSchema: model.CreateIOSchemaRequest{
			ParamTypes: []string{"number", "number", "number"},
			ReturnType: "number",
		},
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

func TestProblemController_UpdateProblem(t *testing.T) {
	router, mockService, controller := setupProblemControllerTest()

	// 테스트 데이터 준비
	problemID := uuid.New()
	updateReq := &model.UpdateProblemRequest{
		Title:        "Updated Problem",
		Description:  "Updated description",
		Constraints:  "1 <= n <= 1000",
		Difficulty:   "Medium",
		InputFormat:  "array",
		OutputFormat: "number",
		FunctionName: "solve",
		TimeLimit:    1000,
		MemoryLimit:  128,
		Examples: []model.CreateExampleRequest{
			{
				Input:       "Updated example",
				Output:      "Updated output",
				Explanation: "Updated explanation",
			},
		},
		TestCases: []model.CreateTestCaseRequest{
			{
				Input:          `[1, 2, 3, 4]`,
				ExpectedOutput: "10",
			},
		},
		IOTemplates: []model.CreateIOTemplateRequest{
			{
				Language: "javascript",
				Code:     "function solve() {}",
			},
		},
		IOSchema: model.CreateIOSchemaRequest{
			ParamTypes: []string{"number", "number", "number", "number"},
			ReturnType: "number",
		},
	}

	updatedProblem := &model.ProblemDetail{
		ID:         problemID,
		Title:      "Updated Problem",
		Difficulty: model.DifficultyMedium,
	}

	// 모의 서비스 설정 - 타입 검증을 완화하여 JSON 파싱 결과와 일치
	mockService.On("UpdateProblem", problemID, mock.AnythingOfType("*model.UpdateProblemRequest")).Return(updatedProblem, nil)

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
	assert.NotNil(t, response["data"])

	// 모의 서비스 호출 확인
	mockService.AssertExpectations(t)
}

func TestProblemController_DeleteProblem(t *testing.T) {
	router, mockService, controller := setupProblemControllerTest()

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

func TestProblemController_GetProblemsByDifficulty(t *testing.T) {
	router, mockService, controller := setupProblemControllerTest()

	// 테스트 데이터 준비
	problems := []*model.ProblemSummary{
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

func TestProblemController_SearchProblems(t *testing.T) {
	router, mockService, controller := setupProblemControllerTest()

	// 테스트 데이터 준비
	problems := []*model.ProblemSummary{
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

func TestProblemController_GetProblemsWithPagination(t *testing.T) {
	router, mockService, controller := setupProblemControllerTest()

	// 테스트 데이터 준비
	problems := []*model.ProblemSummary{
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
