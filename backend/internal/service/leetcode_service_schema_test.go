package service

import (
	"testing"

	appLogger "github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/rs/zerolog"
	"github.com/stretchr/testify/assert"
)

func schemaLogger() appLogger.Logger {
	l := zerolog.New(zerolog.NewTestWriter(nil)).With().Timestamp().Logger()
	return appLogger.NewZerologLogger(l)
}

func TestValidateTestCases_SchemaMismatchLength(t *testing.T) {
	svc := NewLeetCodeService(nil, schemaLogger()).(*leetCodeService)
	tcs := model.TestCases{{Input: []interface{}{1}, Output: 1}}
	schema := model.IOSchema{ParamTypes: []string{"number", "number"}, ReturnType: "number"}
	err := svc.ValidateTestCases(tcs, schema)
	assert.Error(t, err)
}

func TestValidateTestCases_EmptySchema(t *testing.T) {
	svc := NewLeetCodeService(nil, schemaLogger()).(*leetCodeService)
	tcs := model.TestCases{{Input: []interface{}{1}, Output: 1}}
	schema := model.IOSchema{}
	err := svc.ValidateTestCases(tcs, schema)
	assert.Error(t, err)
}
