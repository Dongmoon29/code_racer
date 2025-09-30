package logger

import (
	"bytes"
	"testing"

	"github.com/rs/zerolog"
	"github.com/stretchr/testify/assert"
)

func TestNewZerologLogger_CreatesLogger(t *testing.T) {
	// Given
	log := zerolog.New(bytes.NewBuffer(nil))

	// When
	logger := NewZerologLogger(log)

	// Then
	assert.NotNil(t, logger)
}

func TestZerologLogger_Debug_LogsMessage(t *testing.T) {
	// Given
	var buf bytes.Buffer
	log := zerolog.New(&buf)
	logger := NewZerologLogger(log)

	// When
	logger.Debug().Msg("test debug message")

	// Then
	assert.Contains(t, buf.String(), "test debug message")
	assert.Contains(t, buf.String(), "debug")
}

func TestZerologLogger_Info_LogsMessage(t *testing.T) {
	// Given
	var buf bytes.Buffer
	log := zerolog.New(&buf)
	logger := NewZerologLogger(log)

	// When
	logger.Info().Msg("test info message")

	// Then
	assert.Contains(t, buf.String(), "test info message")
	assert.Contains(t, buf.String(), "info")
}

func TestZerologLogger_Warn_LogsMessage(t *testing.T) {
	// Given
	var buf bytes.Buffer
	log := zerolog.New(&buf)
	logger := NewZerologLogger(log)

	// When
	logger.Warn().Msg("test warn message")

	// Then
	assert.Contains(t, buf.String(), "test warn message")
	assert.Contains(t, buf.String(), "warn")
}

func TestZerologLogger_Error_LogsMessage(t *testing.T) {
	// Given
	var buf bytes.Buffer
	log := zerolog.New(&buf)
	logger := NewZerologLogger(log)

	// When
	logger.Error().Msg("test error message")

	// Then
	assert.Contains(t, buf.String(), "test error message")
	assert.Contains(t, buf.String(), "error")
}

func TestZerologLogger_WithFields_LogsWithFields(t *testing.T) {
	// Given
	var buf bytes.Buffer
	log := zerolog.New(&buf)
	logger := NewZerologLogger(log)

	// When
	logger.Info().
		Str("key1", "value1").
		Int("key2", 42).
		Msg("test message with fields")

	// Then
	assert.Contains(t, buf.String(), "test message with fields")
	assert.Contains(t, buf.String(), "key1")
	assert.Contains(t, buf.String(), "value1")
	assert.Contains(t, buf.String(), "key2")
	assert.Contains(t, buf.String(), "42")
}

func TestZerologLogger_WithError_LogsWithError(t *testing.T) {
	// Given
	var buf bytes.Buffer
	log := zerolog.New(&buf)
	logger := NewZerologLogger(log)
	testErr := assert.AnError

	// When
	logger.Error().
		Err(testErr).
		Msg("test error with error field")

	// Then
	assert.Contains(t, buf.String(), "test error with error field")
	assert.Contains(t, buf.String(), "error")
}

// 테이블 드리븐 테스트
func TestZerologLogger_LogLevels_TableDriven(t *testing.T) {
	tests := []struct {
		name     string
		logFunc  func(*ZerologLogger) *zerolog.Event
		expected string
	}{
		{
			name: "debug level",
			logFunc: func(l *ZerologLogger) *zerolog.Event {
				return l.Debug()
			},
			expected: "debug",
		},
		{
			name: "info level",
			logFunc: func(l *ZerologLogger) *zerolog.Event {
				return l.Info()
			},
			expected: "info",
		},
		{
			name: "warn level",
			logFunc: func(l *ZerologLogger) *zerolog.Event {
				return l.Warn()
			},
			expected: "warn",
		},
		{
			name: "error level",
			logFunc: func(l *ZerologLogger) *zerolog.Event {
				return l.Error()
			},
			expected: "error",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Given
			var buf bytes.Buffer
			log := zerolog.New(&buf)
			logger := NewZerologLogger(log)

			// When
			tt.logFunc(logger).Msg("test message")

			// Then
			assert.Contains(t, buf.String(), "test message")
			assert.Contains(t, buf.String(), tt.expected)
		})
	}
}
