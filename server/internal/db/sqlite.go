package db

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/jmoiron/sqlx"
	"github.com/mattn/go-sqlite3"

	"github.com/b4fun/ku/server/internal/db/dbext"
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

func (p *SqliteProvider) CreateSession(
	ctx context.Context,
	opts *CreateSessionOpts,
) (string, Session, error) {
	if opts.Prefix == "" {
		return "", nil, fmt.Errorf("prefix is required")
	}

	sessionID, err := p.sessionBookkeeper.CreateSession(ctx, opts.Prefix)
	if err != nil {
		return "", nil, fmt.Errorf("sqliteSessionBookkeeper create session: %w", err)
	}

	session := newSqliteSession(sessionID, p.db, p.sessionBookkeeper)

	if err := session.bootstrap(ctx); err != nil {
		return sessionID, nil, fmt.Errorf("bootstrap session %s: %w", sessionID, err)
	}

	return sessionID, session, nil
}

func (p *SqliteProvider) GetQueryService() (QueryService, error) {
	rv := &SqliteQueryService{db: p.db}

	return rv, nil
}

func (p *SqliteProvider) GetSessionRepository() (SessionRepository, error) {
	return p.sessionBookkeeper, nil
}
