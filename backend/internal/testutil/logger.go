package testutil

import (
    "os"

    "github.com/Dongmoon29/code_racer/internal/logger"
    "github.com/rs/zerolog"
)

// SetupTestLogger creates and returns a logger instance for testing
func SetupTestLogger() logger.Logger {
    zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
    log := zerolog.New(os.Stdout).With().Timestamp().Logger()
    return logger.NewZerologLogger(log)
}