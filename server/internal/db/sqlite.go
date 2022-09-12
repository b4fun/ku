package db

import (
	"context"
	"database/sql"
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/jmoiron/sqlx"
	"github.com/mattn/go-sqlite3"

	v1 "github.com/b4fun/ku/protos/api/v1"
	"github.com/b4fun/ku/server/internal/db/dbext"
	"github.com/b4fun/ku/server/internal/utils"
)

const sqliteDriverName = "ku_sqlite3"

func init() {
	sql.Register(sqliteDriverName, &sqlite3.SQLiteDriver{
		ConnectHook: func(conn *sqlite3.SQLiteConn) error {
			if err := dbext.RegisterParseModule(conn); err != nil {
				return fmt.Errorf("RegisterParseModule: %w", err)
			}

			return nil
		},
	})
}

type SqliteProvider struct {
	db *sqlx.DB

	sessionBookkeeper *sqliteSessionBookkeeper
}

var _ Provider = (*SqliteProvider)(nil)

// NewSqliteProvider creates a sqlite based provider.
func NewSqliteProvider(dbPath string) (*SqliteProvider, error) {
	db, err := sqlx.Open(sqliteDriverName, dbPath)
	if err != nil {
		return nil, err
	}

	provider := &SqliteProvider{
		db:                db,
		sessionBookkeeper: newSqliteSessionBookkeeper(db),
	}

	bootstrapCtx, cancel := context.WithTimeout(
		context.Background(),
		10*time.Second,
	)
	defer cancel()

	if err := provider.bootstrap(bootstrapCtx); err != nil {
		return nil, err
	}

	return provider, nil
}

func (p *SqliteProvider) bootstrap(ctx context.Context) error {
	if err := p.sessionBookkeeper.Bootstrap(ctx); err != nil {
		return fmt.Errorf("sqliteSessionBookkeeper bootstrap: %w", err)
	}

	return nil
}

func (p *SqliteProvider) getSessionIDWithPrefix(
	ctx context.Context,
	prefix string,
) (string, error) {
	// TODO: this might be slow as we are listing everything from the db...
	sessions, err := p.sessionBookkeeper.ListSessions(ctx)
	if err != nil {
		return "", fmt.Errorf("list sessions: %w", err)
	}

	sessions = utils.Filter(sessions, func(session *v1.Session) bool {
		return strings.HasPrefix(session.Id, prefix)
	})
	if len(sessions) < 1 {
		return "", nil
	}
	if len(sessions) == 1 {
		return sessions[0].Id, nil
	}

	sort.Slice(sessions, func(i, j int) bool {
		a, b := sessions[i], sessions[j]
		return strings.Compare(a.Id, b.Id) < 0
	})

	return sessions[0].Id, nil
}

func (p *SqliteProvider) CreateSession(
	ctx context.Context,
	opts *CreateSessionOpts,
) (string, Session, error) {
	if opts.Prefix == "" {
		return "", nil, fmt.Errorf("prefix is required")
	}

	var (
		sessionID string
		err       error
	)

	if opts.ReuseExisting {
		sessionID, err = p.getSessionIDWithPrefix(ctx, opts.Prefix)
		if err != nil {
			return "", nil, fmt.Errorf("getSessionIDWithPrefix: %w", err)
		}
	}

	if sessionID == "" {
		// needs to create one
		sessionID, err = p.sessionBookkeeper.CreateSession(ctx, opts.Prefix)
		if err != nil {
			return "", nil, fmt.Errorf("sqliteSessionBookkeeper create session: %w", err)
		}
	}

	session := newSqliteSession(sessionID, p.db, p.sessionBookkeeper)

	if err := session.bootstrap(ctx); err != nil {
		return sessionID, nil, fmt.Errorf("bootstrap session %s: %w", sessionID, err)
	}

	return sessionID, session, nil
}

func (p *SqliteProvider) CreateParsedTable(
	ctx context.Context,
	opts *CreateParsedTableOpts,
) error {
	if opts.Session == nil {
		return fmt.Errorf("session is required")
	}

	session := newSqliteSession(opts.Session.Id, p.db, p.sessionBookkeeper)

	return session.CreateParsedTable(ctx, opts)
}

func (p *SqliteProvider) GetQueryService() (QueryService, error) {
	rv := &SqliteQueryService{db: p.db}

	return rv, nil
}

func (p *SqliteProvider) GetSessionRepository() (SessionRepository, error) {
	return p.sessionBookkeeper, nil
}
