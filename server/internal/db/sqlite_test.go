package db

import (
	"context"
	"fmt"
	"path/filepath"
	"strings"
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

		err = session.WriteLogLinesBatch(ctx, WriteLogLinesBatchPayload{
			Timestamp: time.Now(),
			Lines:     []string{"hello"},
		})
		require.NoError(tc, err)
		err = session.WriteLogLinesBatch(ctx, WriteLogLinesBatchPayload{
			Timestamp: time.Now(),
			Lines:     []string{"world"},
		})
		require.NoError(tc, err)
		sqliteSession := session.(*SqliteSession)

		qs, err := provider.GetQueryService()
		require.NoError(tc, err)
		require.NotNil(tc, qs)

		queryResp, err := qs.QueryTable(ctx, &v1.QueryTableRequest{
			Sql: "select lines from " + sqliteSession.dbTableName(tableNameRaw),
		})
		require.NoError(tc, err)
		require.Len(tc, queryResp.Rows, 2)

		require.Len(tc, queryResp.Columns, 1)
		require.Equal(tc, "lines", queryResp.Columns[0].Key)

		sessionRepo, err := provider.GetSessionRepository()
		require.NoError(tc, err)

		sessions, err := sessionRepo.ListSessions(ctx)
		require.NoError(tc, err)
		require.Len(tc, sessions, 1)
		require.Equal(tc, sessionID, sessions[0].Id)
		require.Len(tc, sessions[0].Tables, 1)

		sessionLoaded, err := sessionRepo.GetSessionByID(ctx, sessionID)
		require.NoError(tc, err)
		require.NotNil(tc, sessionLoaded)
		require.Equal(tc, sessionLoaded.Id, sessionID)
		require.Len(tc, sessionLoaded.Tables, 1)

		sessionLoaded.Name = "updated-name"
		updateErr := sessionRepo.UpdateSession(ctx, sessionLoaded)
		require.NoError(tc, updateErr)

		sessionUpdated, err := sessionRepo.GetSessionByID(ctx, sessionID)
		require.NoError(tc, err)
		require.NotNil(tc, sessionUpdated)
		require.Equal(tc, "updated-name", sessionUpdated.Name)

		err = provider.CreateParsedTable(ctx, &CreateParsedTableOpts{
			Session:   sessionUpdated,
			TableName: "parsed",
			SQL:       fmt.Sprintf("select ts from %s", sqliteSession.dbTableName(tableNameRaw)),
		})
		require.NoError(tc, err)

		sessionUpdated, err = sessionRepo.GetSessionByID(ctx, sessionID)
		require.NoError(tc, err)
		require.NotNil(tc, sessionUpdated)
		require.Len(tc, sessionUpdated.Tables, 2)
		for _, table := range sessionUpdated.Tables {
			require.NotEmpty(tc, table.Columns)
		}
	})

	t.Run("reuse session", func(t *testing.T) {
		tc := newSqliteProviderTestContext(t)
		provider := tc.Provider()

		ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
		defer cancel()

		sessionID1, session, err := provider.CreateSession(ctx, &CreateSessionOpts{
			Prefix: "test",
		})
		require.NoError(tc, err)
		require.NotEmpty(tc, sessionID1)
		require.NotNil(tc, session)

		{
			sessionIDReused, session, err := provider.CreateSession(ctx, &CreateSessionOpts{
				Prefix:        "test",
				ReuseExisting: true,
			})
			require.NoError(tc, err)
			require.NotEmpty(tc, sessionIDReused)
			require.Equal(tc, sessionID1, sessionIDReused)
			require.NotNil(tc, session)
		}

		sessionID2, session, err := provider.CreateSession(ctx, &CreateSessionOpts{
			Prefix: "test",
		})
		require.NoError(tc, err)
		require.NotEmpty(tc, sessionID2)
		require.NotEqual(tc, sessionID1, sessionID2)
		require.NotNil(tc, session)

		sessionIDExpectedToReuse := sessionID1
		if strings.Compare(sessionID1, sessionID2) > 0 {
			sessionIDExpectedToReuse = sessionID2
		}

		{
			sessionIDReused, session, err := provider.CreateSession(ctx, &CreateSessionOpts{
				Prefix:        "test",
				ReuseExisting: true,
			})
			require.NoError(tc, err)
			require.NotEmpty(tc, sessionIDReused)
			require.Equal(tc, sessionIDExpectedToReuse, sessionIDReused)
			require.NotNil(tc, session)
		}
	})

	t.Run("create session with name", func(t *testing.T) {
		tc := newSqliteProviderTestContext(t)
		provider := tc.Provider()

		ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
		defer cancel()

		sessionID, _, err := provider.CreateSession(ctx, &CreateSessionOpts{
			Prefix: "test",
			Name:   "foobar",
		})
		require.NoError(tc, err)
		require.NotEmpty(tc, sessionID)

		sessionRepo, err := provider.GetSessionRepository()
		require.NoError(tc, err)
		dbSession, err := sessionRepo.GetSessionByID(ctx, sessionID)
		require.NoError(tc, err)
		require.Equal(tc, "foobar", dbSession.Name)
	})
}
