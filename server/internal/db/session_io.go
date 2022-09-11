package db

import (
	"bufio"
	"context"
	"fmt"
	"io"
	"sync"
	"time"
)

type sessionLogWriter struct {
	Session

	createCtx func() (context.Context, context.CancelFunc)
	nowFn     func() time.Time

	scannerInput io.WriteCloser
	scanner      *bufio.Scanner
	scannerErr   error
	scanning     *sync.WaitGroup
}

// SessionLogWriteCloser wraps the session as a io.WriteCloser instance.
// The behavior of concurrency write to this writer is undefined.
func SessionLogWriteCloser(
	rootCtx context.Context,
	session Session,
	logWriteTimeout time.Duration,
) io.WriteCloser {
	pr, pw := io.Pipe()

	rv := &sessionLogWriter{
		Session: session,
		createCtx: func() (context.Context, context.CancelFunc) {
			return context.WithTimeout(rootCtx, logWriteTimeout)
		},
		nowFn: time.Now,

		scannerInput: pw,
		scanner:      bufio.NewScanner(pr),
		scanning:     new(sync.WaitGroup),
	}

	rv.scanning.Add(1)
	go rv.scan()

	return rv
}

var _ io.WriteCloser = (*sessionLogWriter)(nil)

func (swr *sessionLogWriter) writeLogLine(logLine string) error {
	ctx, cancel := swr.createCtx()
	defer cancel()

	err := swr.Session.WriteLogLine(
		ctx,
		WriteLogLinePayload{
			Timestamp: swr.nowFn(),
			Line:      logLine,
		},
	)
	if err != nil {
		return fmt.Errorf("WriteLogLine: %w", err)
	}

	return nil
}

func (swr *sessionLogWriter) scan() {
	defer swr.scanning.Done()

	for swr.scanner.Scan() {
		if err := swr.writeLogLine(swr.scanner.Text()); err != nil {
			swr.scannerErr = err
			return
		}
	}

	if err := swr.scanner.Err(); err != nil {
		swr.scannerErr = err
	}
}

func (swr *sessionLogWriter) Write(p []byte) (int, error) {
	return swr.scannerInput.Write(p)
}

func (swr *sessionLogWriter) Close() error {
	if err := swr.scannerInput.Close(); err != nil {
		return err
	}

	// wait for scanner to finish
	swr.scanning.Wait()
	return swr.scannerErr
}
