package db

import (
	"context"
	"path/filepath"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

type mockSession struct {
	WriteLogLinesBatchFunc func(ctx context.Context, payload WriteLogLinesBatchPayload) error
}

var _ Session = (*mockSession)(nil)

func (s *mockSession) WriteLogLinesBatch(
	ctx context.Context,
	payload WriteLogLinesBatchPayload,
) error {
	return s.WriteLogLinesBatchFunc(ctx, payload)
}

func TestSessionLogWriter(t *testing.T) {
	newSessionLogWriter := func(
		rootCtx context.Context,
		session Session,
		logWriteTimeout time.Duration,
	) *sessionLogWriter {
		rv := SessionLogWriteCloser(rootCtx, session, logWriteTimeout)
		return rv.(*sessionLogWriter)
	}

	t.Run("write serial", func(t *testing.T) {
		var wrote []string

		mockSession := &mockSession{
			WriteLogLinesBatchFunc: func(ctx context.Context, payload WriteLogLinesBatchPayload) error {
				wrote = append(wrote, payload.Lines...)

				return nil
			},
		}

		w := newSessionLogWriter(context.Background(), mockSession, 100*time.Millisecond)
		for _, s := range []string{
			"hello\n",
			"world\n",
		} {
			_, err := w.Write([]byte(s))
			require.NoError(t, err)
		}
		require.NoError(t, w.Close())

		require.Len(t, wrote, 2)
		require.Equal(t, "hello", wrote[0])
		require.Equal(t, "world", wrote[1])
	})

	t.Run("write partial", func(t *testing.T) {
		var wrote []string

		mockSession := &mockSession{
			WriteLogLinesBatchFunc: func(ctx context.Context, payload WriteLogLinesBatchPayload) error {
				wrote = append(wrote, payload.Lines...)

				return nil
			},
		}

		w := newSessionLogWriter(context.Background(), mockSession, 100*time.Millisecond)
		for _, s := range []string{
			"hell",
			"o\n",
			"world\n",
			"foo", // closed without a newline
		} {
			_, err := w.Write([]byte(s))
			require.NoError(t, err)
		}
		require.NoError(t, w.Close())

		require.Len(t, wrote, 3)
		require.Equal(t, "hello", wrote[0])
		require.Equal(t, "world", wrote[1])
		require.Equal(t, "foo", wrote[2])
	})
}

// go test -run=^$ -benchtime 30s -bench ^BenchmarkSessionLogWriter$ github.com/b4fun/ku/server/internal/db
func BenchmarkSessionLogWriter(b *testing.B) {
	run := func() {
		ctx, cancel := context.WithCancel(context.Background())
		defer cancel()

		p := b.TempDir()
		dbFile := filepath.Join(p, "test.db")
		dbProvider, err := NewSqliteProvider(dbFile)
		require.NoError(b, err)

		_, session, err := dbProvider.CreateSession(ctx, &CreateSessionOpts{Prefix: "test"})
		require.NoError(b, err)

		writer := SessionLogWriteCloser(ctx, session, 100*time.Millisecond)

		for i := 0; i < 10000; i++ {
			content := []byte("hello world\n")

			_, err := writer.Write(content)
			require.NoError(b, err)
		}

		require.NoError(b, writer.Close())
	}

	for i := 0; i < b.N; i++ {
		run()
	}
}
