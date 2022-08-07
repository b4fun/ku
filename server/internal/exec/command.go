package exec

import (
	"context"
	"fmt"
	"io"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/b4fun/ku/server/internal/base"
	"github.com/b4fun/ku/server/internal/db"
	"github.com/b4fun/ku/server/internal/utils"
	"github.com/go-logr/logr"
)

type Opts struct {
	Logger logr.Logger

	Command string
	Args    []string
	Stdout  io.Writer
	Stderr  io.Writer

	SessionProvider db.Provider
}

func (opts *Opts) defaults() error {
	if opts.Logger.GetSink() == nil {
		opts.Logger = logr.Discard()
	}
	if opts.Command == "" {
		return fmt.Errorf(".Command is required")
	}
	if opts.SessionProvider == nil {
		return fmt.Errorf(".SessionProvider is required")
	}

	return nil
}

func normalizeCommandName(path string) string {
	// TODO: escape as valid sql string literal
	p := filepath.Base(path)
	return strings.ToLower(p)
}

func normalizeSessionID(sessionID string) string {
	if sessionID == "" {
		return "(unknown)"
	}
	return sessionID
}

func Command(opts *Opts) (base.Runnable, error) {
	if err := opts.defaults(); err != nil {
		return nil, err
	}

	runnable := base.RunnableFunc(func(ctx context.Context) error {
		sessionID, session, err := opts.SessionProvider.CreateSession(ctx, &db.CreateSessionOpts{
			Prefix: normalizeCommandName(opts.Command),
		})
		logger := opts.Logger.WithValues("command", opts.Command, "session", normalizeSessionID(sessionID))
		if err != nil {
			logger.Error(err, "create log session")
			return fmt.Errorf("create log session: %w", err)
		}

		cmd := exec.CommandContext(ctx, opts.Command, opts.Args...)
		stdout, err := cmd.StdoutPipe()
		if err != nil {
			logger.Error(err, "open cmd stdout pipe")
			return fmt.Errorf("open cmd stdout pipe: %w", err)
		}
		stderr, err := cmd.StderrPipe()
		if err != nil {
			logger.Error(err, "open cmd stderr pipe")
			return fmt.Errorf("open cmd stderr pipe: %w", err)
		}
		if err := cmd.Start(); err != nil {
			logger.Error(err, "start cmd")
			return fmt.Errorf("start cmd: %w", err)
		}

		const channelsCount = 2

		wg := new(sync.WaitGroup)
		errCh := make(chan error, channelsCount)
		wg.Add(channelsCount)

		go streamLogAsync(
			wg,
			errCh,
			stdout,
			db.SessionLogWriteCloser(ctx, session, 100*time.Millisecond),
			opts.Stdout,
		)
		go streamLogAsync(
			wg,
			errCh,
			stderr,
			db.SessionLogWriteCloser(ctx, session, 100*time.Millisecond),
			opts.Stderr,
		)

		wg.Wait()
		close(errCh)

		if err := cmd.Wait(); err != nil {
			logger.Error(err, "execute command")
			return fmt.Errorf("execute command: %w", err)
		}

		for i := 0; i < channelsCount; i++ {
			if err := <-errCh; err != nil {
				logger.Info("stream log failed", "err", err)
			}
		}
		logger.Info("command execution has finished")

		return nil
	})

	return runnable, nil
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
