package applog

import (
	"fmt"

	"github.com/go-logr/logr"
	"github.com/go-logr/zapr"
	"go.uber.org/zap"
)

func newLogger() (logr.Logger, error) {
	zapLog, err := zap.NewDevelopment()
	if err != nil {
		return logr.Logger{}, err
	}
	return zapr.NewLogger(zapLog), nil
}

var Setup logr.Logger

func init() {
	logger, err := newLogger()
	if err != nil {
		panic(err.Error())
	}
	Setup = logger.WithName("setup")
}

func NewLogger(sessionPrefix string) (logr.Logger, error) {
	config := zap.NewDevelopmentConfig()
	config.OutputPaths = []string{
		fmt.Sprintf("%s://%s", logSinkScheme, sessionPrefix),
	}

	zapLog, err := config.Build()
	if err != nil {
		return logr.Logger{}, err
	}
	return zapr.NewLogger(zapLog), nil
}
