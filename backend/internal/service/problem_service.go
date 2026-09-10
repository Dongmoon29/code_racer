package service

import (
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/Dongmoon29/code_racer/internal/apperr"
	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/Dongmoon29/code_racer/internal/repository"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ProblemService represents the new normalized problem service interface
type ProblemService interface {
	GetAllProblems() ([]*model.ProblemSummary, error)
	GetProblemsPage(page, limit int) ([]*model.ProblemSummary, int64, error)
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
		return nil, apperr.Wrap(err, apperr.CodeInternal, "Failed to fetch problems")
	}

	return toProblemSummaries(problems), nil
}

func (s *problemService) GetProblemsPage(page, limit int) ([]*model.ProblemSummary, int64, error) {
	problems, total, err := s.problemRepo.FindPage((page-1)*limit, limit)
	if err != nil {
		s.logger.Error().Err(err).Int("page", page).Int("limit", limit).Msg("Failed to fetch problem page")
		return nil, 0, apperr.Wrap(err, apperr.CodeInternal, "Failed to fetch problems")
	}

	return toProblemSummaries(problems), total, nil
}

func (s *problemService) GetProblemByID(id uuid.UUID) (*model.ProblemDetail, error) {
	problem, err := s.problemRepo.FindWithRelations(id)
	s.logger.Debug().Str("problemID", id.String()).Msg("problem")
	if err != nil {
		s.logger.Error().Err(err).Str("problemID", id.String()).Msg("Failed to fetch problem by ID")
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperr.Wrap(err, apperr.CodeNotFound, "Problem not found")
		}
		return nil, apperr.Wrap(err, apperr.CodeInternal, "Failed to fetch problem")
	}

	return problem.ToDetailResponse(), nil
}

func (s *problemService) CreateProblem(req *model.CreateProblemRequest) (*model.ProblemDetail, error) {
	problem, err := s.problemFromRequest(req)
	if err != nil {
		return nil, err
	}

	if err := s.problemRepo.Create(problem); err != nil {
		s.logger.Error().Err(err).Str("title", req.Title).Msg("Failed to create problem")
		return nil, apperr.Wrap(err, apperr.CodeInternal, "Failed to create problem")
	}

	s.logger.Info().Str("problemID", problem.ID.String()).Str("title", req.Title).Msg("Problem created successfully")
	return problem.ToDetailResponse(), nil
}

func (s *problemService) UpdateProblem(id uuid.UUID, req *model.UpdateProblemRequest) (*model.ProblemDetail, error) {
	// Fetch existing problem
	existingProblem, err := s.problemRepo.FindWithRelations(id)
	if err != nil {
		s.logger.Error().Err(err).Str("problemID", id.String()).Msg("Failed to fetch existing problem for update")
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperr.Wrap(err, apperr.CodeNotFound, "Problem not found")
		}
		return nil, apperr.Wrap(err, apperr.CodeInternal, "Failed to load problem")
	}

	definition, err := s.problemFromRequest((*model.CreateProblemRequest)(req))
	if err != nil {
		return nil, err
	}
	applyProblemDefinition(existingProblem, definition)

	if err := s.problemRepo.Update(existingProblem); err != nil {
		s.logger.Error().Err(err).Str("problemID", id.String()).Msg("Failed to update problem")
		return nil, apperr.Wrap(err, apperr.CodeInternal, "Failed to update problem")
	}

	s.logger.Info().Str("problemID", id.String()).Str("title", req.Title).Msg("Problem updated successfully")
	return existingProblem.ToDetailResponse(), nil
}

func (s *problemService) DeleteProblem(id uuid.UUID) error {
	// Fetch existing problem (존재 여부 확인)
	_, err := s.problemRepo.FindByID(id)
	if err != nil {
		s.logger.Error().Err(err).Str("problemID", id.String()).Msg("Failed to fetch problem for deletion")
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return apperr.Wrap(err, apperr.CodeNotFound, "Problem not found")
		}
		return apperr.Wrap(err, apperr.CodeInternal, "Failed to load problem")
	}

	if err := s.problemRepo.Delete(id); err != nil {
		s.logger.Error().Err(err).Str("problemID", id.String()).Msg("Failed to delete problem")
		return apperr.Wrap(err, apperr.CodeInternal, "Failed to delete problem")
	}

	s.logger.Info().Str("problemID", id.String()).Msg("Problem deleted successfully")
	return nil
}

func (s *problemService) GetProblemsByDifficulty(difficulty string) ([]*model.ProblemSummary, error) {
	problems, err := s.problemRepo.FindByDifficulty(difficulty)
	if err != nil {
		s.logger.Error().Err(err).Str("difficulty", difficulty).Msg("Failed to fetch problems by difficulty")
		return nil, apperr.Wrap(err, apperr.CodeInternal, "Failed to fetch problems")
	}

	return toProblemSummaries(problems), nil
}

func (s *problemService) SearchProblems(query string) ([]*model.ProblemSummary, error) {
	problems, err := s.problemRepo.Search(query)
	if err != nil {
		s.logger.Error().Err(err).Str("query", query).Msg("Failed to search problems")
		return nil, apperr.Wrap(err, apperr.CodeInternal, "Failed to search problems")
	}

	return toProblemSummaries(problems), nil
}

func (s *problemService) problemFromRequest(req *model.CreateProblemRequest) (*model.Problem, error) {
	functionName := strings.TrimSpace(req.FunctionName)
	paramTypes, returnType, err := model.NormalizeFunctionContract(functionName, req.IOSchema.ParamTypes, req.IOSchema.ReturnType)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeBadRequest, "Invalid function contract")
	}
	schema := model.CreateIOSchemaRequest{ParamTypes: paramTypes, ReturnType: returnType}
	if err := s.ValidateTestCases(req.TestCases, schema); err != nil {
		return nil, apperr.Wrap(err, apperr.CodeBadRequest, "Invalid test cases")
	}

	examples := make([]model.Example, len(req.Examples))
	for i, example := range req.Examples {
		examples[i] = model.Example{
			Input:       example.Input,
			Output:      example.Output,
			Explanation: example.Explanation,
		}
	}
	testCases := make([]model.TestCase, len(req.TestCases))
	for i, testCase := range req.TestCases {
		testCases[i] = model.TestCase{
			Input:          testCase.Input,
			ExpectedOutput: testCase.ExpectedOutput,
		}
	}

	return &model.Problem{
		Title:        req.Title,
		Description:  req.Description,
		Constraints:  req.Constraints,
		Difficulty:   model.Difficulty(req.Difficulty),
		FunctionName: functionName,
		TimeLimit:    req.TimeLimit,
		MemoryLimit:  req.MemoryLimit,
		Examples:     examples,
		TestCases:    testCases,
		IOSchema: model.IOSchema{
			ParamTypes: paramTypes,
			ReturnType: returnType,
		},
	}, nil
}

func applyProblemDefinition(problem, definition *model.Problem) {
	problem.Title = definition.Title
	problem.Description = definition.Description
	problem.Constraints = definition.Constraints
	problem.Difficulty = definition.Difficulty
	problem.FunctionName = definition.FunctionName
	problem.TimeLimit = definition.TimeLimit
	problem.MemoryLimit = definition.MemoryLimit
	problem.Examples = definition.Examples
	problem.TestCases = definition.TestCases
	problem.IOSchema = definition.IOSchema
}

func toProblemSummaries(problems []model.Problem) []*model.ProblemSummary {
	summaries := make([]*model.ProblemSummary, len(problems))
	for i := range problems {
		summaries[i] = problems[i].ToSummaryResponse()
	}
	return summaries
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
		// Every test case uses one shape, including single-parameter problems:
		// input is always a JSON array of function arguments.
		var args []json.RawMessage
		if err := json.Unmarshal([]byte(testCase.Input), &args); err != nil {
			return fmt.Errorf("test case %d: input must be a JSON array of arguments", i+1)
		}
		if len(args) != len(schema.ParamTypes) {
			return fmt.Errorf("test case %d: argument count %d does not match contract count %d", i+1, len(args), len(schema.ParamTypes))
		}
		for argIndex, arg := range args {
			if err := model.ValidateJSONValue(arg, schema.ParamTypes[argIndex]); err != nil {
				return fmt.Errorf("test case %d argument %d: %w", i+1, argIndex+1, err)
			}
		}
		if strings.TrimSpace(testCase.ExpectedOutput) == "" {
			return fmt.Errorf("test case %d: expected output cannot be empty", i+1)
		}
		if err := model.ValidateJSONValue(json.RawMessage(testCase.ExpectedOutput), schema.ReturnType); err != nil {
			return fmt.Errorf("test case %d expected output: %w", i+1, err)
		}
	}
	return nil
}
