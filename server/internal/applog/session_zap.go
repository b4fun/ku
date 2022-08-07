package applog

import (
	"context"
	"fmt"
	"io"
	"net/url"
	"strings"
	"time"

	"github.com/b4fun/ku/server/internal/db"
	"go.uber.org/zap"
)

type zapSessionSink struct {
	io.WriteCloser
}

var _ zap.Sink = (*zapSessionSink)(nil)

func (sink *zapSessionSink) Sync() error {
	return nil
}

const logSinkScheme = "ku"

// InstallDBLogger installs logger sink for database driver.
func InstallDBLogger(ctx context.Context, sessionProvider db.Provider) error {
	return zap.RegisterSink(
		logSinkScheme,
		func(u *url.URL) (zap.Sink, error) {
			_, session, err := sessionProvider.CreateSession(ctx, &db.CreateSessionOpts{
				Prefix: strings.ToLower(u.Host),
			})
			if err != nil {
				return nil, fmt.Errorf("CreateSession: %w", err)
			}
			sessionWriter := db.SessionLogWriteCloser(
				ctx,
				session,
				100*time.Millisecond,
			)

			return &zapSessionSink{sessionWriter}, nil
		},
	)
}
