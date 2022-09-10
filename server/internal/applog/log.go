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

// LoggerConfigOption applies extra configuration to the logger config.
type LoggerConfigOption interface {
	apply(*zap.Config)
}

type loggerConfigOptionFunc func(*zap.Config)

func (f loggerConfigOptionFunc) apply(c *zap.Config) {
	f(c)
}

// LogToStderr configures the logger to log to stderr.
func LogToStderr(enabled bool) LoggerConfigOption {
	return loggerConfigOptionFunc(func(c *zap.Config) {
		if !enabled {
			return
		}

		c.OutputPaths = append(
			c.OutputPaths,
			"stderr",
		)
	})
}

// NewLogger creates a logger with database driver enabled.
func NewLogger(
	sessionPrefix string,
	opts ...LoggerConfigOption,
) (logr.Logger, error) {
	config := zap.NewDevelopmentConfig()
	config.OutputPaths = []string{
		fmt.Sprintf("%s://%s", logSinkScheme, sessionPrefix),
	}
	for _, opt := range opts {
		opt.apply(&config)
	}

	zapLog, err := config.Build()
	if err != nil {
		return logr.Logger{}, err
	}
	return zapr.NewLogger(zapLog), nil
}
