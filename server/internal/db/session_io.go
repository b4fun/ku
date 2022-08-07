package db

import (
	"context"
	"fmt"
	"io"
	"strings"
	"time"
)

type sessionWriter struct {
	Session

	createCtx func() (context.Context, context.CancelFunc)
	nowFn     func() time.Time
}

// SessionLogWriteCloser wraps the session as a io.WriteCloser instance.
func SessionLogWriteCloser(
	rootCtx context.Context,
	session Session,
	logWriteTimeout time.Duration,
) io.WriteCloser {
	return &sessionWriter{
		Session: session,
		createCtx: func() (context.Context, context.CancelFunc) {
			return context.WithTimeout(rootCtx, logWriteTimeout)
		},
		nowFn: time.Now,
	}
}

var _ io.WriteCloser = (*sessionWriter)(nil)

func (swr *sessionWriter) Write(p []byte) (int, error) {
	ctx, cancel := swr.createCtx()
	defer cancel()

	err := swr.Session.WriteLogLine(
		ctx,
		WriteLogLinePayload{
			Timestamp: swr.nowFn(),
			// FIXME: just assuming the data is a full line
			// TODO(hbc): allow passing a customize separator and
			//            maintain an internal buffer for data to write
			Line: strings.TrimSuffix(string(p), "\n"),
		},
	)
	if err != nil {
		return -1, fmt.Errorf("WriteLogLine: %w", err)
	}

	return len(p), nil
}

func (swr *sessionWriter) Close() error {
	// no-op
	return nil
}
