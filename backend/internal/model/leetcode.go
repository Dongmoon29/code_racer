package model

import (
	"database/sql/driver"
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Difficulty LeetCode 문제 난이도를 표현하는 enum
type Difficulty string

const (
	DifficultyEasy   Difficulty = "Easy"
	DifficultyMedium Difficulty = "Medium"
	DifficultyHard   Difficulty = "Hard"
)

type TestCase struct {
	Input  []interface{} `json:"input"`
	Output interface{}   `json:"output"`
}

// TestCases는 TestCase의 슬라이스를 위한 사용자 정의 타입
type TestCases []TestCase

// Value GORM에서 데이터베이스에 저장하기 위한 메서드
func (tcs TestCases) Value() (driver.Value, error) {
	return json.Marshal(tcs)
}

// Scan GORM에서 데이터베이스에서 읽기 위한 메서드
func (tcs *TestCases) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, tcs)
}

// LeetCode LeetCode 문제 정보를 담는 모델
type LeetCode struct {
	ID                 uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	Title              string    `gorm:"type:varchar(255);not null" json:"title"`
	Description        string    `gorm:"type:text;not null" json:"description"`
	Examples           string    `gorm:"type:text;not null" json:"examples"`
	Constraints        string    `gorm:"type:text;not null" json:"constraints"`
	TestCases          TestCases `gorm:"type:jsonb;not null" json:"test_cases"`
	ExpectedOutputs    string    `gorm:"type:text;not null" json:"expected_outputs"`
	Difficulty         string    `gorm:"type:varchar(20);not null" json:"difficulty"`
	InputFormat        string    `gorm:"type:varchar(50);not null" json:"input_format"`
	OutputFormat       string    `gorm:"type:varchar(50);not null" json:"output_format"`
	FunctionName       string    `gorm:"type:varchar(50);not null" json:"function_name"`
	TimeLimit          int       `gorm:"not null" json:"time_limit"`
	MemoryLimit        int       `gorm:"not null" json:"memory_limit"`
	JavaScriptTemplate string    `gorm:"type:text;not null" json:"javascript_template"`
	PythonTemplate     string    `gorm:"type:text;not null" json:"python_template"`
	GoTemplate         string    `gorm:"type:text;not null" json:"go_template"`
	JavaTemplate       string    `gorm:"type:text;not null" json:"java_template"`
	CPPTemplate        string    `gorm:"type:text;not null" json:"cpp_template"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}

// BeforeCreate UUID 생성을 위한 GORM 훅
func (l *LeetCode) BeforeCreate(tx *gorm.DB) error {
	if l.ID == uuid.Nil {
		l.ID = uuid.New()
	}
	return nil
}

// LeetCodeSummary LeetCode 요약 정보 응답 DTO
type LeetCodeSummary struct {
	ID         uuid.UUID  `json:"id"`
	Title      string     `json:"title"`
	Difficulty Difficulty `json:"difficulty"`
}

// ToSummaryResponse LeetCode 모델을 LeetCodeSummary DTO로 변환
func (l *LeetCode) ToSummaryResponse() *LeetCodeSummary {
	return &LeetCodeSummary{
		ID:         l.ID,
		Title:      l.Title,
		Difficulty: Difficulty(l.Difficulty),
	}
}

// LeetCodeDetail LeetCode 상세 정보 응답 DTO
type LeetCodeDetail struct {
	ID                 uuid.UUID  `json:"id"`
	Title              string     `json:"title"`
	Description        string     `json:"description"`
	Examples           string     `json:"examples"`
	Constraints        string     `json:"constraints"`
	Difficulty         Difficulty `json:"difficulty"`
	TestCases          []TestCase `json:"test_cases"`
	ExpectedOutputs    []string   `json:"expected_outputs"`
	InputFormat        string     `json:"input_format"`
	OutputFormat       string     `json:"output_format"`
	FunctionName       string     `json:"function_name"`
	JavaScriptTemplate string     `json:"javascript_template"`
	PythonTemplate     string     `json:"python_template"`
	GoTemplate         string     `json:"go_template"`
	JavaTemplate       string     `json:"java_template"`
	CPPTemplate        string     `json:"cpp_template"`
}

// ToDetailResponse LeetCode 모델을 LeetCodeDetail DTO로 변환
func (l *LeetCode) ToDetailResponse() *LeetCodeDetail {
	testCases := l.TestCases
	expectedOutputs := SplitByLine(l.ExpectedOutputs)

	return &LeetCodeDetail{
		ID:                 l.ID,
		Title:              l.Title,
		Description:        l.Description,
		Examples:           l.Examples,
		Constraints:        l.Constraints,
		Difficulty:         Difficulty(l.Difficulty),
		TestCases:          testCases,
		ExpectedOutputs:    expectedOutputs,
		InputFormat:        l.InputFormat,
		OutputFormat:       l.OutputFormat,
		FunctionName:       l.FunctionName,
		JavaScriptTemplate: l.JavaScriptTemplate,
		PythonTemplate:     l.PythonTemplate,
		GoTemplate:         l.GoTemplate,
		JavaTemplate:       l.JavaTemplate,
		CPPTemplate:        l.CPPTemplate,
	}
}

// SplitByLine 문자열을 줄 단위로 분리하는 헬퍼 함수
func SplitByLine(s string) []string {
	var result []string
	var current string

	for i := 0; i < len(s); i++ {
		if s[i] == '\n' {
			result = append(result, current)
			current = ""
		} else {
			current += string(s[i])
		}
	}

	if current != "" {
		result = append(result, current)
	}

	return result
}
