package applog

import (
	"fmt"

	"github.com/go-logr/logr"
	"github.com/go-logr/zapr"
	"go.uber.org/zap"
)

func mustNewSetupLogger() logr.Logger {
	zapLog, err := zap.NewDevelopment()
	if err != nil {
		panic(err.Error())
	}
	return zapr.NewLogger(zapLog).WithName("setup")
}

// Setup creates the logger for setup usage.
var Setup logr.Logger

func init() {
	Setup = mustNewSetupLogger()
}

// NewLogger creates a logger with database driver enabled.
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
