package applog

import (
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

// MustNew creates a logger. It panics on error.
func MustNew() logr.Logger {
	logger, err := newLogger()
	if err != nil {
		panic(err.Error())
	}

	return logger
}
