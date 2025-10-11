package service

import (
	"encoding/json"
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

// ProblemService represents the new normalized problem service interface
type ProblemService interface {
	GetAllProblems() ([]*model.ProblemSummary, error)
	GetProblemByID(id uuid.UUID) (*model.ProblemDetail, error)
	CreateProblem(req *model.CreateProblemRequest) (*model.ProblemDetail, error)
	UpdateProblem(id uuid.UUID, req *model.UpdateProblemRequest) (*model.ProblemDetail, error)
	DeleteProblem(id uuid.UUID) error
	GetProblemsByDifficulty(difficulty string) ([]*model.ProblemSummary, error)
	SearchProblems(query string) ([]*model.ProblemSummary, error)
	ValidateTestCases(testCases []model.CreateTestCaseRequest, schema model.CreateIOSchemaRequest) error
}

type problemService struct {
	problemRepo repository.ProblemRepository
	logger      logger.Logger
}

// NewProblemService creates a new ProblemService instance with the provided dependencies
func NewProblemService(problemRepo repository.ProblemRepository, logger logger.Logger) ProblemService {
	return &problemService{
		problemRepo: problemRepo,
		logger:      logger,
	}
}

// ========================
// ProblemService implementation
// ========================

func (s *problemService) GetAllProblems() ([]*model.ProblemSummary, error) {
	problems, err := s.problemRepo.FindAll()
	if err != nil {
		s.logger.Error().Err(err).Msg("Failed to fetch all problems")
		return nil, fmt.Errorf("failed to fetch problems: %w", err)
	}

	var summaries []*model.ProblemSummary
	for _, problem := range problems {
		summaries = append(summaries, problem.ToSummaryResponse())
	}

	return summaries, nil
}

func (s *problemService) GetProblemByID(id uuid.UUID) (*model.ProblemDetail, error) {
	problem, err := s.problemRepo.FindWithRelations(id)
	if err != nil {
		s.logger.Error().Err(err).Str("problemID", id.String()).Msg("Failed to fetch problem by ID")
		return nil, fmt.Errorf("problem not found: %w", err)
	}

	return problem.ToDetailResponse(), nil
}

func (s *problemService) CreateProblem(req *model.CreateProblemRequest) (*model.ProblemDetail, error) {
	// Validate test cases
	if err := s.ValidateTestCases(req.TestCases, req.IOSchema); err != nil {
		return nil, fmt.Errorf("invalid test cases: %w", err)
	}

	// Convert Examples
	var examples []model.Example
	for _, ex := range req.Examples {
		examples = append(examples, model.Example{
			Input:       ex.Input,
			Output:      ex.Output,
			Explanation: ex.Explanation,
		})
	}

	// Convert TestCases
	var testCases []model.TestCase
	for _, tc := range req.TestCases {
		testCases = append(testCases, model.TestCase{
			Input:          tc.Input,
			ExpectedOutput: tc.ExpectedOutput,
		})
	}

	// Convert IOTemplates
	var ioTemplates []model.IOTemplate
	for _, tmpl := range req.IOTemplates {
		ioTemplates = append(ioTemplates, model.IOTemplate{
			Language: tmpl.Language,
			Code:     tmpl.Code,
		})
	}

	// Convert IOSchema
	paramTypesJSON, err := json.Marshal(req.IOSchema.ParamTypes)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal param types: %w", err)
	}

	problem := &model.Problem{
		Title:        req.Title,
		Description:  req.Description,
		Constraints:  req.Constraints,
		Difficulty:   model.Difficulty(req.Difficulty),
		InputFormat:  req.InputFormat,
		OutputFormat: req.OutputFormat,
		FunctionName: req.FunctionName,
		TimeLimit:    req.TimeLimit,
		MemoryLimit:  req.MemoryLimit,
		Examples:     examples,
		TestCases:    testCases,
		IOTemplates:  ioTemplates,
		IOSchema: model.IOSchema{
			ParamTypes: string(paramTypesJSON),
			ReturnType: req.IOSchema.ReturnType,
		},
	}

	if err := s.problemRepo.Create(problem); err != nil {
		s.logger.Error().Err(err).Str("title", req.Title).Msg("Failed to create problem")
		return nil, fmt.Errorf("failed to create problem: %w", err)
	}

	s.logger.Info().Str("problemID", problem.ID.String()).Str("title", req.Title).Msg("Problem created successfully")
	return problem.ToDetailResponse(), nil
}

func (s *problemService) UpdateProblem(id uuid.UUID, req *model.UpdateProblemRequest) (*model.ProblemDetail, error) {
	// Fetch existing problem
	existingProblem, err := s.problemRepo.FindWithRelations(id)
	if err != nil {
		s.logger.Error().Err(err).Str("problemID", id.String()).Msg("Failed to fetch existing problem for update")
		return nil, fmt.Errorf("problem not found: %w", err)
	}

	// Validate test cases
	if err := s.ValidateTestCases(req.TestCases, req.IOSchema); err != nil {
		return nil, fmt.Errorf("invalid test cases: %w", err)
	}

	// Convert Examples
	var examples []model.Example
	for _, ex := range req.Examples {
		examples = append(examples, model.Example{
			Input:       ex.Input,
			Output:      ex.Output,
			Explanation: ex.Explanation,
		})
	}

	// Convert TestCases
	var testCases []model.TestCase
	for _, tc := range req.TestCases {
		testCases = append(testCases, model.TestCase{
			Input:          tc.Input,
			ExpectedOutput: tc.ExpectedOutput,
		})
	}

	// Convert IOTemplates
	var ioTemplates []model.IOTemplate
	for _, tmpl := range req.IOTemplates {
		ioTemplates = append(ioTemplates, model.IOTemplate{
			Language: tmpl.Language,
			Code:     tmpl.Code,
		})
	}

	// Convert IOSchema
	paramTypesJSON, err := json.Marshal(req.IOSchema.ParamTypes)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal param types: %w", err)
	}

	// Update fields
	existingProblem.Title = req.Title
	existingProblem.Description = req.Description
	existingProblem.Constraints = req.Constraints
	existingProblem.Difficulty = model.Difficulty(req.Difficulty)
	existingProblem.InputFormat = req.InputFormat
	existingProblem.OutputFormat = req.OutputFormat
	existingProblem.FunctionName = req.FunctionName
	existingProblem.TimeLimit = req.TimeLimit
	existingProblem.MemoryLimit = req.MemoryLimit
	existingProblem.Examples = examples
	existingProblem.TestCases = testCases
	existingProblem.IOTemplates = ioTemplates
	existingProblem.IOSchema = model.IOSchema{
		ParamTypes: string(paramTypesJSON),
		ReturnType: req.IOSchema.ReturnType,
	}

	if err := s.problemRepo.Update(existingProblem); err != nil {
		s.logger.Error().Err(err).Str("problemID", id.String()).Msg("Failed to update problem")
		return nil, fmt.Errorf("failed to update problem: %w", err)
	}

	s.logger.Info().Str("problemID", id.String()).Str("title", req.Title).Msg("Problem updated successfully")
	return existingProblem.ToDetailResponse(), nil
}

func (s *problemService) DeleteProblem(id uuid.UUID) error {
	// Fetch existing problem (존재 여부 확인)
	_, err := s.problemRepo.FindByID(id)
	if err != nil {
		s.logger.Error().Err(err).Str("problemID", id.String()).Msg("Failed to fetch problem for deletion")
		return fmt.Errorf("problem not found: %w", err)
	}

	if err := s.problemRepo.Delete(id); err != nil {
		s.logger.Error().Err(err).Str("problemID", id.String()).Msg("Failed to delete problem")
		return fmt.Errorf("failed to delete problem: %w", err)
	}

	s.logger.Info().Str("problemID", id.String()).Msg("Problem deleted successfully")
	return nil
}

func (s *problemService) GetProblemsByDifficulty(difficulty string) ([]*model.ProblemSummary, error) {
	problems, err := s.problemRepo.FindByDifficulty(difficulty)
	if err != nil {
		s.logger.Error().Err(err).Str("difficulty", difficulty).Msg("Failed to fetch problems by difficulty")
		return nil, fmt.Errorf("failed to fetch problems: %w", err)
	}

	var summaries []*model.ProblemSummary
	for _, problem := range problems {
		summaries = append(summaries, problem.ToSummaryResponse())
	}

	return summaries, nil
}

func (s *problemService) SearchProblems(query string) ([]*model.ProblemSummary, error) {
	problems, err := s.problemRepo.Search(query)
	if err != nil {
		s.logger.Error().Err(err).Str("query", query).Msg("Failed to search problems")
		return nil, fmt.Errorf("failed to search problems: %w", err)
	}

	var summaries []*model.ProblemSummary
	for _, problem := range problems {
		summaries = append(summaries, problem.ToSummaryResponse())
	}

	return summaries, nil
}

func (s *problemService) ValidateTestCases(testCases []model.CreateTestCaseRequest, schema model.CreateIOSchemaRequest) error {
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
		// Parse input as JSON to check parameter count
		var input []interface{}
		if err := json.Unmarshal([]byte(testCase.Input), &input); err != nil {
			return fmt.Errorf("test case %d: invalid input JSON format", i+1)
		}

		if len(input) != len(schema.ParamTypes) {
			return fmt.Errorf("test case %d: input length %d does not match schema length %d", i+1, len(input), len(schema.ParamTypes))
		}
		if testCase.ExpectedOutput == "" {
			return fmt.Errorf("test case %d: expected output cannot be empty", i+1)
		}
	}
	return nil
}
