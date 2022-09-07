package db

import (
	"context"
	"path/filepath"
	"testing"
	"time"

	v1 "github.com/b4fun/ku/protos/api/v1"
	"github.com/jmoiron/sqlx"
	"github.com/stretchr/testify/require"
)

type sqliteProviderTestContext struct {
	testing.TB

	db         *sqlx.DB
	dbProvider *SqliteProvider
}

func newSqliteProviderTestContext(t testing.TB) *sqliteProviderTestContext {
	t.Helper()

	tempDir := t.TempDir()
	tempDBPath := filepath.Join(tempDir, "test.db")
	dbProvider, err := NewSqliteProvider(tempDBPath)
	require.NoError(t, err)
	db := dbProvider.db
	t.Cleanup(func() {
		_ = db.Close()
	})

	return &sqliteProviderTestContext{
		TB:         t,
		db:         db,
		dbProvider: dbProvider,
	}
}

func (tc *sqliteProviderTestContext) Provider() *SqliteProvider {
	return tc.dbProvider
}

func TestSqliteProvider(t *testing.T) {
	t.Run("basic usage", func(t *testing.T) {
		tc := newSqliteProviderTestContext(t)
		provider := tc.Provider()

		ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
		defer cancel()

		sessionID, session, err := provider.CreateSession(ctx, &CreateSessionOpts{
			Prefix: "test",
		})
		require.NoError(tc, err)
		require.NotEmpty(tc, sessionID)
		require.NotNil(tc, session)

		err = session.WriteLogLine(ctx, WriteLogLinePayload{
			Timestamp: time.Now(),
			Line:      "hello",
		})
		require.NoError(tc, err)
		err = session.WriteLogLine(ctx, WriteLogLinePayload{
			Timestamp: time.Now(),
			Line:      "world",
		})
		require.NoError(tc, err)
		sqliteSession := session.(*SqliteSession)

		qs, err := provider.GetQueryService()
		require.NoError(tc, err)
		require.NotNil(tc, qs)

		queryResp, err := qs.QueryTable(ctx, &v1.QueryTableRequest{
			Sql: "select lines from " + sqliteSession.rawTableName(),
		})
		require.NoError(tc, err)
		require.Len(tc, queryResp.Rows, 2)

		require.Len(tc, queryResp.Columns, 1)
		require.Equal(tc, "lines", queryResp.Columns[0].Key)

		sessions, err := provider.ListSessions(ctx)
		require.NoError(tc, err)
		require.Len(tc, sessions, 1)
		require.Equal(tc, sessionID, sessions[0].Id)
		require.Len(tc, sessions[0].Tables, 1)
	})
}
