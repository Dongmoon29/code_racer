package logger

import (
	"os"

	"github.com/Dongmoon29/code_racer/internal/util"
	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

type Logger interface {
	Debug() *zerolog.Event
	Info() *zerolog.Event
	Warn() *zerolog.Event
	Error() *zerolog.Event
	Fatal() *zerolog.Event
}

type ZerologLogger struct {
	log zerolog.Logger
}

func NewZerologLogger(log zerolog.Logger) *ZerologLogger {
	return &ZerologLogger{log: log}
}

// Logger 인터페이스 구현
func (l *ZerologLogger) Debug() *zerolog.Event { return l.log.Debug() }
func (l *ZerologLogger) Info() *zerolog.Event  { return l.log.Info() }
func (l *ZerologLogger) Warn() *zerolog.Event  { return l.log.Warn() }
func (l *ZerologLogger) Error() *zerolog.Event { return l.log.Error() }
func (l *ZerologLogger) Fatal() *zerolog.Event { return l.log.Fatal() }

// GormWriter GORM 로거를 위한 zerolog 어댑터
type GormWriter struct {
	logger Logger
}

func NewGormWriter(logger Logger) *GormWriter {
	return &GormWriter{logger: logger}
}

func (w *GormWriter) Printf(format string, args ...interface{}) {
	w.logger.Info().Msgf(format, args...)
}

func SetupGlobalLogger() Logger {
	log.Info().Msgf("Starting application in %s mode", gin.Mode())

	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix

	// Set log level based on environment
	if !util.IsProduction() {
		zerolog.SetGlobalLevel(zerolog.DebugLevel)
		log.Info().Msg("Global log level set to DEBUG (development mode)")
	} else {
		zerolog.SetGlobalLevel(zerolog.InfoLevel)
		log.Info().Msg("Global log level set to INFO (production mode)")
	}

	// Configure console output
	log.Logger = log.Output(zerolog.ConsoleWriter{
		Out:        os.Stdout,
		TimeFormat: "2006-01-02 15:04:05",
		NoColor:    util.IsProduction(),
	})

	return NewZerologLogger(log.Logger)
}
