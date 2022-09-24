package db

import (
	"bufio"
	"context"
	"fmt"
	"io"
	"sync"
	"time"
)

// TODO(hbc): tune based on usage?
const (
	sessionLogBuffer       = 500
	sessionLogSendInterval = 50 * time.Millisecond
)

type sendSessionLog struct {
	Line    string
	ScanErr error
}

type sessionLogWriter struct {
	Session

	createCtx func() (context.Context, context.CancelFunc)
	nowFn     func() time.Time

	scannerInput io.WriteCloser
	scanner      *bufio.Scanner
	scanning     *sync.WaitGroup

	sendLogsChan chan sendSessionLog
	sending      *sync.WaitGroup
	sendErr      error
}

// SessionLogWriteCloser wraps the session as a io.WriteCloser instance.
// It's not allowed to call Write() concurrently.
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

		sendLogsChan: make(chan sendSessionLog, sessionLogBuffer),
		sending:      new(sync.WaitGroup),
	}

	rv.scanning.Add(1)
	go rv.scan()

	rv.sending.Add(1)
	go rv.sendLogs()

	return rv
}

var _ io.WriteCloser = (*sessionLogWriter)(nil)

func (swr *sessionLogWriter) sendLogs() {
	defer swr.sending.Done()

	sendTicker := time.NewTicker(sessionLogSendInterval)
	defer sendTicker.Stop()

	sendLogs := func(lines []string) error {
		if len(lines) == 0 {
			return nil
		}

		ctx, cancel := swr.createCtx()
		defer cancel()

		err := swr.Session.WriteLogLinesBatch(ctx, WriteLogLinesBatchPayload{
			Lines:     lines,
			Timestamp: swr.nowFn(),
		})
		if err != nil {
			return fmt.Errorf("WriteLogLinesBatch: %w", err)
		}

		return nil
	}

	var lines []string
	for {
		select {
		case sendLog, ok := <-swr.sendLogsChan:
			if !ok || sendLog.ScanErr != nil {
				// channel closed or scan failed, send all logs and store error
				sendErr := sendLogs(lines)
				if sendErr != nil {
					swr.sendErr = sendErr
				} else if sendLog.ScanErr != nil {
					swr.sendErr = sendLog.ScanErr
				}
				return
			}

			// append logs to send buffer
			lines = append(lines, sendLog.Line)
		case <-sendTicker.C:
			// send ticker fired, send all buffered logs
			if err := sendLogs(lines); err != nil {
				swr.sendErr = err
				return
			}
			lines = nil
		}
	}
}

func (swr *sessionLogWriter) scan() {
	defer swr.scanning.Done()

	for swr.scanner.Scan() {
		swr.sendLogsChan <- sendSessionLog{
			Line: swr.scanner.Text(),
		}
	}

	if err := swr.scanner.Err(); err != nil {
		swr.sendLogsChan <- sendSessionLog{
			ScanErr: err,
		}
	}
}

func (swr *sessionLogWriter) Write(p []byte) (int, error) {
	// FIXME(hbc): race on the sendErr
	if swr.sendErr != nil {
		return 0, swr.sendErr
	}

	return swr.scannerInput.Write(p)
}

func (swr *sessionLogWriter) Close() error {
	// stop scanner
	if err := swr.scannerInput.Close(); err != nil {
		return err
	}
	swr.scanning.Wait()

	// stop logs sender
	close(swr.sendLogsChan)
	swr.sending.Wait()

	if swr.sendErr != nil {
		return swr.sendErr
	}

	return nil
}
