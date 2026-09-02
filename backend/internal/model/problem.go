package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Difficulty string

const (
	DifficultyEasy   Difficulty = "Easy"
	DifficultyMedium Difficulty = "Medium"
	DifficultyHard   Difficulty = "Hard"
)

// ========================
// Problem represents the main problem table
// ========================
type Problem struct {
	ID           uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	Title        string     `gorm:"type:varchar(255);not null" json:"title"`
	Description  string     `gorm:"type:text;not null" json:"description"`
	Constraints  string     `gorm:"type:text;not null" json:"constraints"`
	Difficulty   Difficulty `gorm:"type:varchar(20);not null" json:"difficulty"`
	FunctionName string     `gorm:"type:varchar(50);not null" json:"function_name"`
	TimeLimit    int        `gorm:"not null" json:"time_limit"`
	MemoryLimit  int        `gorm:"not null" json:"memory_limit"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`

	// Relations
	Examples  []Example  `gorm:"foreignKey:ProblemID;constraint:OnDelete:CASCADE" json:"examples"`
	TestCases []TestCase `gorm:"foreignKey:ProblemID;constraint:OnDelete:CASCADE" json:"test_cases"`
	IOSchema  IOSchema   `gorm:"foreignKey:ProblemID;constraint:OnDelete:CASCADE" json:"io_schema"`
}

// BeforeCreate sets UUID automatically
func (p *Problem) BeforeCreate(tx *gorm.DB) (err error) {
	p.ID = uuid.New()
	return
}

// ========================
// Example
// ========================
type Example struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	ProblemID   uuid.UUID `gorm:"type:uuid;not null;index" json:"problem_id"`
	Input       string    `gorm:"type:text" json:"input"`
	Output      string    `gorm:"type:text" json:"output"`
	Explanation string    `gorm:"type:text" json:"explanation"`
}

func (e *Example) BeforeCreate(tx *gorm.DB) (err error) {
	e.ID = uuid.New()
	return
}

// ========================
// TestCase
// ========================
type TestCase struct {
	ID             uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	ProblemID      uuid.UUID `gorm:"type:uuid;not null;index" json:"problem_id"`
	Input          string    `gorm:"type:text" json:"input"`
	ExpectedOutput string    `gorm:"type:text" json:"expected_output"`
}

func (t *TestCase) BeforeCreate(tx *gorm.DB) (err error) {
	t.ID = uuid.New()
	return
}

// ========================
// IOSchema represents input/output type schema
// ========================
type IOSchema struct {
	ID         uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	ProblemID  uuid.UUID `gorm:"type:uuid;not null;index" json:"problem_id"`
	ParamTypes []string  `gorm:"type:text;serializer:json" json:"param_types"`
	ReturnType string    `gorm:"type:varchar(50)" json:"return_type"`
}

func (s *IOSchema) BeforeCreate(tx *gorm.DB) (err error) {
	s.ID = uuid.New()
	return
}

// ========================
// DTOs and conversion methods
// ========================

// ProblemSummary represents problem summary response DTO
type ProblemSummary struct {
	ID         uuid.UUID  `json:"id"`
	Title      string     `json:"title"`
	Difficulty Difficulty `json:"difficulty"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`
}

// ToSummaryResponse converts Problem model to ProblemSummary DTO
func (p *Problem) ToSummaryResponse() *ProblemSummary {
	return &ProblemSummary{
		ID:         p.ID,
		Title:      p.Title,
		Difficulty: p.Difficulty,
		CreatedAt:  p.CreatedAt,
		UpdatedAt:  p.UpdatedAt,
	}
}

// ProblemDetail represents problem detail response DTO
type ProblemDetail struct {
	ID           uuid.UUID         `json:"id"`
	Title        string            `json:"title"`
	Description  string            `json:"description"`
	Examples     []Example         `json:"examples"`
	Constraints  string            `json:"constraints"`
	Difficulty   Difficulty        `json:"difficulty"`
	TestCases    []TestCase        `json:"test_cases"`
	FunctionName string            `json:"function_name"`
	IOSchema     IOSchemaResponse  `json:"io_schema"`
	IOTemplates  []StarterTemplate `json:"io_templates"`
	TimeLimit    int               `json:"time_limit"`
	MemoryLimit  int               `json:"memory_limit"`
}

// IOSchemaResponse is the canonical public representation of a function
// contract. ParamTypes is an array everywhere outside the persistence layer.
type IOSchemaResponse struct {
	ParamTypes []string `json:"param_types"`
	ReturnType string   `json:"return_type"`
}

// StarterTemplate is generated from the function contract. It is not stored
// per problem, preventing language templates from drifting out of sync.
type StarterTemplate struct {
	Language string `json:"language"`
	Code     string `json:"code"`
}

// ToDetailResponse converts Problem model to ProblemDetail DTO
func (p *Problem) ToDetailResponse() *ProblemDetail {

	paramTypes, returnType, _ := NormalizeFunctionContract(
		p.FunctionName,
		p.IOSchema.ParamTypes,
		p.IOSchema.ReturnType,
	)

	return &ProblemDetail{
		ID:           p.ID,
		Title:        p.Title,
		Description:  p.Description,
		Examples:     p.Examples,
		Constraints:  p.Constraints,
		Difficulty:   p.Difficulty,
		TestCases:    p.TestCases,
		FunctionName: p.FunctionName,
		IOSchema: IOSchemaResponse{
			ParamTypes: paramTypes,
			ReturnType: returnType,
		},
		IOTemplates: GenerateStarterTemplates(p.FunctionName, paramTypes, returnType),
		TimeLimit:   p.TimeLimit,
		MemoryLimit: p.MemoryLimit,
	}
}

// ToPublicDetailResponse returns the problem statement and starter templates
// without judge-only inputs or expected outputs.
func (p *Problem) ToPublicDetailResponse() *ProblemDetail {
	detail := p.ToDetailResponse()
	detail.TestCases = []TestCase{}
	return detail
}

// ========================
// New normalized request DTOs
// ========================

// CreateProblemRequest represents new normalized problem creation request DTO
type CreateProblemRequest struct {
	Title        string                  `json:"title" binding:"required"`
	Description  string                  `json:"description" binding:"required"`
	Constraints  string                  `json:"constraints" binding:"required"`
	Difficulty   string                  `json:"difficulty" binding:"required,oneof=Easy Medium Hard"`
	FunctionName string                  `json:"function_name" binding:"required"`
	TimeLimit    int                     `json:"time_limit" binding:"required"`
	MemoryLimit  int                     `json:"memory_limit" binding:"required"`
	Examples     []CreateExampleRequest  `json:"examples" binding:"required"`
	TestCases    []CreateTestCaseRequest `json:"test_cases" binding:"required"`
	IOSchema     CreateIOSchemaRequest   `json:"io_schema" binding:"required"`
}

// CreateExampleRequest represents example creation request DTO
type CreateExampleRequest struct {
	Input       string `json:"input" binding:"required"`
	Output      string `json:"output" binding:"required"`
	Explanation string `json:"explanation"`
}

// CreateTestCaseRequest represents test case creation request DTO
type CreateTestCaseRequest struct {
	Input          string `json:"input" binding:"required"`
	ExpectedOutput string `json:"expected_output" binding:"required"`
}

// CreateIOSchemaRequest represents IO schema creation request DTO
type CreateIOSchemaRequest struct {
	ParamTypes []string `json:"param_types" binding:"required"`
	ReturnType string   `json:"return_type" binding:"required"`
}

// UpdateProblemRequest has the same fields as CreateProblemRequest
type UpdateProblemRequest CreateProblemRequest
