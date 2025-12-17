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
	InputFormat  string     `gorm:"type:varchar(50);not null" json:"input_format"`
	OutputFormat string     `gorm:"type:varchar(50);not null" json:"output_format"`
	FunctionName string     `gorm:"type:varchar(50);not null" json:"function_name"`
	TimeLimit    int        `gorm:"not null" json:"time_limit"`
	MemoryLimit  int        `gorm:"not null" json:"memory_limit"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`

	// Relations
	Examples    []Example    `gorm:"foreignKey:ProblemID;constraint:OnDelete:CASCADE" json:"examples"`
	TestCases   []TestCase   `gorm:"foreignKey:ProblemID;constraint:OnDelete:CASCADE" json:"test_cases"`
	IOTemplates []IOTemplate `gorm:"foreignKey:ProblemID;constraint:OnDelete:CASCADE" json:"io_templates"`
	IOSchema    IOSchema     `gorm:"foreignKey:ProblemID;constraint:OnDelete:CASCADE" json:"io_schema"`
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
// IOTemplate represents language-specific code templates
// ========================
type IOTemplate struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	ProblemID uuid.UUID `gorm:"type:uuid;not null;index" json:"problem_id"`
	Language  string    `gorm:"type:varchar(20)" json:"language"`
	Code      string    `gorm:"type:text" json:"code"`
}

func (t *IOTemplate) BeforeCreate(tx *gorm.DB) (err error) {
	t.ID = uuid.New()
	return
}

// ========================
// IOSchema represents input/output type schema
// ========================
type IOSchema struct {
	ID         uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	ProblemID  uuid.UUID `gorm:"type:uuid;not null;index" json:"problem_id"`
	ParamTypes string    `gorm:"type:text" json:"param_types"` // JSON string
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
	ID                 uuid.UUID  `json:"id"`
	Title              string     `json:"title"`
	Description        string     `json:"description"`
	Examples           []Example  `json:"examples"`
	Constraints        string     `json:"constraints"`
	Difficulty         Difficulty `json:"difficulty"`
	TestCases          []TestCase `json:"test_cases"`
	ExpectedOutputs    []string   `json:"expected_outputs"`
	InputFormat        string     `json:"input_format"`
	OutputFormat       string     `json:"output_format"`
	FunctionName       string     `json:"function_name"`
	IOSchema           IOSchema   `json:"io_schema"`
	JavaScriptTemplate string     `json:"javascript_template"`
	PythonTemplate     string     `json:"python_template"`
	GoTemplate         string     `json:"go_template"`
	JavaTemplate       string     `json:"java_template"`
	CPPTemplate        string     `json:"cpp_template"`
}

// ToDetailResponse converts Problem model to ProblemDetail DTO
func (p *Problem) ToDetailResponse() *ProblemDetail {

	// Convert TestCases
	var testCases []TestCase
	var expectedOutputs []string
	for _, tc := range p.TestCases {
		testCases = append(testCases, tc)
		expectedOutputs = append(expectedOutputs, tc.ExpectedOutput)
	}

	// Get language-specific templates
	templates := make(map[string]string)
	for _, template := range p.IOTemplates {
		templates[template.Language] = template.Code
	}

	return &ProblemDetail{
		ID:                 p.ID,
		Title:              p.Title,
		Description:        p.Description,
		Examples:           p.Examples,
		Constraints:        p.Constraints,
		Difficulty:         p.Difficulty,
		TestCases:          testCases,
		ExpectedOutputs:    expectedOutputs,
		InputFormat:        p.InputFormat,
		OutputFormat:       p.OutputFormat,
		FunctionName:       p.FunctionName,
		IOSchema:           p.IOSchema,
		JavaScriptTemplate: templates["javascript"],
		PythonTemplate:     templates["python"],
		GoTemplate:         templates["go"],
		JavaTemplate:       templates["java"],
		CPPTemplate:        templates["cpp"],
	}
}

// ========================
// New normalized request DTOs
// ========================

// CreateProblemRequest represents new normalized problem creation request DTO
type CreateProblemRequest struct {
	Title        string                    `json:"title" binding:"required"`
	Description  string                    `json:"description" binding:"required"`
	Constraints  string                    `json:"constraints" binding:"required"`
	Difficulty   string                    `json:"difficulty" binding:"required,oneof=Easy Medium Hard"`
	InputFormat  string                    `json:"input_format" binding:"required"`
	OutputFormat string                    `json:"output_format" binding:"required"`
	FunctionName string                    `json:"function_name" binding:"required"`
	TimeLimit    int                       `json:"time_limit" binding:"required"`
	MemoryLimit  int                       `json:"memory_limit" binding:"required"`
	Examples     []CreateExampleRequest    `json:"examples" binding:"required"`
	TestCases    []CreateTestCaseRequest   `json:"test_cases" binding:"required"`
	IOTemplates  []CreateIOTemplateRequest `json:"io_templates" binding:"required"`
	IOSchema     CreateIOSchemaRequest     `json:"io_schema" binding:"required"`
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

// CreateIOTemplateRequest represents IO template creation request DTO
type CreateIOTemplateRequest struct {
	Language string `json:"language" binding:"required"`
	Code     string `json:"code" binding:"required"`
}

// CreateIOSchemaRequest represents IO schema creation request DTO
type CreateIOSchemaRequest struct {
	ParamTypes []string `json:"param_types" binding:"required"`
	ReturnType string   `json:"return_type" binding:"required"`
}

// UpdateProblemRequest has the same fields as CreateProblemRequest
type UpdateProblemRequest CreateProblemRequest
