package db

import (
	"context"
	"fmt"

	"github.com/jmoiron/sqlx"
	"github.com/lithammer/shortuuid"
	_ "github.com/mattn/go-sqlite3"
)

type SqliteProvider struct {
	db *sqlx.DB
}

var _ Provider = (*SqliteProvider)(nil)

func NewSqliteProvider(dbPath string) (*SqliteProvider, error) {
	db, err := sqlx.Open("sqlite3", dbPath)
	if err != nil {
		return nil, err
	}

	return &SqliteProvider{db: db}, nil
}

func (p *SqliteProvider) CreateSession(ctx context.Context) (Session, error) {
	sessionID := shortuuid.New()

	session := &SqliteSession{
		TableName: fmt.Sprintf("session_%s", sessionID),
		db:        p.db,
	}

	if err := session.bootstrap(ctx); err != nil {
		return nil, fmt.Errorf("bootstrap session %s: %w", sessionID, err)
	}

	return session, nil
}

type SqliteSession struct {
	TableName string

	db *sqlx.DB
}

var _ Session = (*SqliteSession)(nil)

func (s *SqliteSession) bootstrap(ctx context.Context) error {
	const dropTableTmpl = `DROP TABLE IF EXISTS %s`

	const createTableTmpl = `
CREATE TABLE %s (
	ts datetime,
	lines text
);
`

	if _, err := s.db.ExecContext(ctx, fmt.Sprintf(dropTableTmpl, s.rawTableName())); err != nil {
		return fmt.Errorf("failed to drop raw table: %w", err)
	}

	if _, err := s.db.ExecContext(ctx, fmt.Sprintf(createTableTmpl, s.rawTableName())); err != nil {
		return fmt.Errorf("failed to create raw table: %w", err)
	}

	return nil
}

func (s *SqliteSession) rawTableName() string {
	return fmt.Sprintf("%s_raw", s.TableName)
}

func (s *SqliteSession) WriteLogLine(ctx context.Context, payload WriteLogLinePayload) error {
	const insertTmpl = `INSERT INTO %s (ts, lines) VALUES (?, ?)`

	stmt := fmt.Sprintf(insertTmpl, s.rawTableName())
	if _, err := s.db.ExecContext(ctx, stmt, payload.Timestamp, payload.Line); err != nil {
		return fmt.Errorf("failed to insert log line: %w", err)
	}

	return nil
}
