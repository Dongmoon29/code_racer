package factory

import (
	"github.com/Dongmoon29/code_racer/internal/interfaces"
	"github.com/Dongmoon29/code_racer/internal/judge"
	"github.com/Dongmoon29/code_racer/internal/logger"
)

func NewCodeWrapper(logger logger.Logger) interfaces.CodeWrapper {
	return judge.NewCodeWrapper(logger)
}

func NewJudge0Client(apiKey, apiEndpoint string) interfaces.Judge0Client {
	config := judge.DefaultJudge0Config(apiKey, apiEndpoint)
	return judge.NewJudge0Client(config)
}
