package exec

import (
	"context"
	"fmt"
	"io"
	"strings"
	"sync"
	"time"

	"github.com/b4fun/ku/server/internal/db"
	"github.com/b4fun/ku/server/internal/utils"
)

type sessionLog struct {
	db.Session

	createCtx func() (context.Context, context.CancelFunc)
	nowFn     func() time.Time
}

func newSessionLog(
	rootCtx context.Context,
	session db.Session,
	logWriteTimeout time.Duration,
) *sessionLog {
	return &sessionLog{
		Session: session,
		createCtx: func() (context.Context, context.CancelFunc) {
			return context.WithTimeout(rootCtx, logWriteTimeout)
		},
		nowFn: time.Now,
	}
}

var _ io.Writer = (*sessionLog)(nil)

func (l *sessionLog) Write(p []byte) (int, error) {
	ctx, cancel := l.createCtx()
	defer cancel()

	err := l.Session.WriteLogLine(
		ctx,
		db.WriteLogLinePayload{
			Timestamp: l.nowFn(),
			// FIXME: just assuming the data is a full line
			Line: strings.TrimSuffix(string(p), "\n"),
		},
	)
	if err != nil {
		return -1, fmt.Errorf("WriteLogLine: %w", err)
	}

	return len(p), nil
}

func streamLogAsync(
	wg *sync.WaitGroup,
	errCh chan<- error,
	src io.Reader,
	dest io.Writer,
	destRemains ...io.Writer,
) {
	defer wg.Done()

	destRemains = utils.Filter(destRemains, func(w io.Writer) bool {
		return w != nil
	})

	var destWriter io.Writer
	if len(destRemains) < 1 {
		destWriter = dest
	} else {
		destWriter = io.MultiWriter(append([]io.Writer{dest}, destRemains...)...)
	}

	_, err := io.Copy(destWriter, src)
	errCh <- err
}
