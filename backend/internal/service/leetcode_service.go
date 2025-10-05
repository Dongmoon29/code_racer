package service

import (
	"fmt"

	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/Dongmoon29/code_racer/internal/repository"
	"github.com/google/uuid"
)

// Default limits for LeetCode problems
const (
	defaultTimeLimit   = 1000 // milliseconds
	defaultMemoryLimit = 128  // MB
)

type LeetCodeService interface {
	GetAllProblems() ([]*model.LeetCodeSummary, error)
	GetProblemByID(id uuid.UUID) (*model.LeetCodeDetail, error)
	CreateProblem(req *model.CreateLeetCodeRequest) (*model.LeetCodeDetail, error)
	UpdateProblem(id uuid.UUID, req *model.UpdateLeetCodeRequest) (*model.LeetCodeDetail, error)
	DeleteProblem(id uuid.UUID) error
	GetProblemsByDifficulty(difficulty string) ([]*model.LeetCodeSummary, error)
	SearchProblems(query string) ([]*model.LeetCodeSummary, error)
	ValidateTestCases(testCases model.TestCases, schema model.IOSchema) error
}

type leetCodeService struct {
	leetCodeRepo repository.LeetCodeRepository
	logger       logger.Logger
}

// NewLeetCodeService creates a new LeetCodeService instance with the provided dependencies
func NewLeetCodeService(leetCodeRepo repository.LeetCodeRepository, logger logger.Logger) LeetCodeService {
	return &leetCodeService{
		leetCodeRepo: leetCodeRepo,
		logger:       logger,
	}
}

func (s *leetCodeService) GetAllProblems() ([]*model.LeetCodeSummary, error) {
	problems, err := s.leetCodeRepo.FindAll()
	if err != nil {
		s.logger.Error().Err(err).Msg("Failed to fetch all problems")
		return nil, fmt.Errorf("failed to fetch problems: %w", err)
	}

	var summaries []*model.LeetCodeSummary
	for _, problem := range problems {
		summaries = append(summaries, problem.ToSummaryResponse())
	}

	return summaries, nil
}

func (s *leetCodeService) GetProblemByID(id uuid.UUID) (*model.LeetCodeDetail, error) {
	problem, err := s.leetCodeRepo.FindByID(id)
	if err != nil {
		s.logger.Error().Err(err).Str("problemID", id.String()).Msg("Failed to fetch problem by ID")
		return nil, fmt.Errorf("problem not found: %w", err)
	}

	return problem.ToDetailResponse(), nil
}

func (s *leetCodeService) CreateProblem(req *model.CreateLeetCodeRequest) (*model.LeetCodeDetail, error) {
	// 테스트 케이스 유효성 검사 (스키마 기반)
	if err := s.ValidateTestCases(req.TestCases, req.IOSchema); err != nil {
		return nil, fmt.Errorf("invalid test cases: %w", err)
	}

	problem := &model.LeetCode{
		Title:              req.Title,
		Description:        req.Description,
		Examples:           req.Examples,
		Constraints:        req.Constraints,
		TestCases:          req.TestCases,
		IOSchema:           req.IOSchema,
		ExpectedOutputs:    req.ExpectedOutputs,
		Difficulty:         req.Difficulty,
		InputFormat:        req.InputFormat,
		OutputFormat:       req.OutputFormat,
		FunctionName:       req.FunctionName,
		TimeLimit:          defaultTimeLimit,
		MemoryLimit:        defaultMemoryLimit,
		JavaScriptTemplate: req.JavaScriptTemplate,
		PythonTemplate:     req.PythonTemplate,
		GoTemplate:         req.GoTemplate,
		JavaTemplate:       req.JavaTemplate,
		CPPTemplate:        req.CPPTemplate,
	}

	if err := s.leetCodeRepo.Create(problem); err != nil {
		s.logger.Error().Err(err).Str("title", req.Title).Msg("Failed to create problem")
		return nil, fmt.Errorf("failed to create problem: %w", err)
	}

	s.logger.Info().Str("problemID", problem.ID.String()).Str("title", req.Title).Msg("Problem created successfully")
	return problem.ToDetailResponse(), nil
}

func (s *leetCodeService) UpdateProblem(id uuid.UUID, req *model.UpdateLeetCodeRequest) (*model.LeetCodeDetail, error) {
	// 기존 문제 조회
	existingProblem, err := s.leetCodeRepo.FindByID(id)
	if err != nil {
		s.logger.Error().Err(err).Str("problemID", id.String()).Msg("Failed to fetch existing problem for update")
		return nil, fmt.Errorf("problem not found: %w", err)
	}

	// 테스트 케이스 유효성 검사 (스키마 기반)
	if err := s.ValidateTestCases(req.TestCases, req.IOSchema); err != nil {
		return nil, fmt.Errorf("invalid test cases: %w", err)
	}

	// 필드 업데이트
	existingProblem.Title = req.Title
	existingProblem.Description = req.Description
	existingProblem.Examples = req.Examples
	existingProblem.Constraints = req.Constraints
	existingProblem.TestCases = req.TestCases
	existingProblem.ExpectedOutputs = req.ExpectedOutputs
	existingProblem.Difficulty = req.Difficulty
	existingProblem.InputFormat = req.InputFormat
	existingProblem.OutputFormat = req.OutputFormat
	existingProblem.FunctionName = req.FunctionName
	existingProblem.IOSchema = req.IOSchema
	existingProblem.JavaScriptTemplate = req.JavaScriptTemplate
	existingProblem.PythonTemplate = req.PythonTemplate
	existingProblem.GoTemplate = req.GoTemplate
	existingProblem.JavaTemplate = req.JavaTemplate
	existingProblem.CPPTemplate = req.CPPTemplate

	if err := s.leetCodeRepo.Update(existingProblem); err != nil {
		s.logger.Error().Err(err).Str("problemID", id.String()).Msg("Failed to update problem")
		return nil, fmt.Errorf("failed to update problem: %w", err)
	}

	s.logger.Info().Str("problemID", id.String()).Str("title", req.Title).Msg("Problem updated successfully")
	return existingProblem.ToDetailResponse(), nil
}

func (s *leetCodeService) DeleteProblem(id uuid.UUID) error {
	// 기존 문제 조회 (존재 여부 확인)
	_, err := s.leetCodeRepo.FindByID(id)
	if err != nil {
		s.logger.Error().Err(err).Str("problemID", id.String()).Msg("Failed to fetch problem for deletion")
		return fmt.Errorf("problem not found: %w", err)
	}

	if err := s.leetCodeRepo.Delete(id); err != nil {
		s.logger.Error().Err(err).Str("problemID", id.String()).Msg("Failed to delete problem")
		return fmt.Errorf("failed to delete problem: %w", err)
	}

	s.logger.Info().Str("problemID", id.String()).Msg("Problem deleted successfully")
	return nil
}

func (s *leetCodeService) GetProblemsByDifficulty(difficulty string) ([]*model.LeetCodeSummary, error) {
	problems, err := s.leetCodeRepo.FindByDifficulty(difficulty)
	if err != nil {
		s.logger.Error().Err(err).Str("difficulty", difficulty).Msg("Failed to fetch problems by difficulty")
		return nil, fmt.Errorf("failed to fetch problems: %w", err)
	}

	var summaries []*model.LeetCodeSummary
	for _, problem := range problems {
		summaries = append(summaries, problem.ToSummaryResponse())
	}

	return summaries, nil
}

func (s *leetCodeService) SearchProblems(query string) ([]*model.LeetCodeSummary, error) {
	problems, err := s.leetCodeRepo.Search(query)
	if err != nil {
		s.logger.Error().Err(err).Str("query", query).Msg("Failed to search problems")
		return nil, fmt.Errorf("failed to search problems: %w", err)
	}

	var summaries []*model.LeetCodeSummary
	for _, problem := range problems {
		summaries = append(summaries, problem.ToSummaryResponse())
	}

	return summaries, nil
}

func (s *leetCodeService) ValidateTestCases(testCases model.TestCases, schema model.IOSchema) error {
	if len(testCases) == 0 {
		return fmt.Errorf("at least one test case is required")
	}
	if len(schema.ParamTypes) == 0 {
		return fmt.Errorf("schema: at least one parameter type is required")
	}
	if schema.ReturnType == "" {
		return fmt.Errorf("schema: return type is required")
	}

	for i, testCase := range testCases {
		if len(testCase.Input) != len(schema.ParamTypes) {
			return fmt.Errorf("test case %d: input length %d does not match schema length %d", i+1, len(testCase.Input), len(schema.ParamTypes))
		}
		if testCase.Output == nil {
			return fmt.Errorf("test case %d: output cannot be nil", i+1)
		}
	}
	return nil
}
