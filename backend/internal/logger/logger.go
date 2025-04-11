package logger

import "github.com/rs/zerolog"

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
