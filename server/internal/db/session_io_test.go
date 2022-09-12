package db

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

type mockSession struct {
	WriteLogLineFuc func(ctx context.Context, payload WriteLogLinePayload) error
}

var _ Session = (*mockSession)(nil)

func (s *mockSession) WriteLogLine(
	ctx context.Context,
	payload WriteLogLinePayload,
) error {
	return s.WriteLogLineFuc(ctx, payload)
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
		var wrote []WriteLogLinePayload

		mockSession := &mockSession{
			WriteLogLineFuc: func(ctx context.Context, payload WriteLogLinePayload) error {
				wrote = append(wrote, payload)

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
		require.Equal(t, "hello", wrote[0].Line)
		require.Equal(t, "world", wrote[1].Line)
	})

	t.Run("write partial", func(t *testing.T) {
		var wrote []WriteLogLinePayload

		mockSession := &mockSession{
			WriteLogLineFuc: func(ctx context.Context, payload WriteLogLinePayload) error {
				wrote = append(wrote, payload)

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
		require.Equal(t, "hello", wrote[0].Line)
		require.Equal(t, "world", wrote[1].Line)
		require.Equal(t, "foo", wrote[2].Line)
	})
}