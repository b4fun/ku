package db

import (
	"context"
	"fmt"

	"github.com/jmoiron/sqlx"
)

type SqliteSession struct {
	sessionID string

	db                *sqlx.DB
	sessionBookkeeper *sqliteSessionBookkeeper
}

func newSqliteSession(
	sessionID string,
	db *sqlx.DB,
	sessionBookkeeper *sqliteSessionBookkeeper,
) *SqliteSession {
	return &SqliteSession{
		sessionID:         sessionID,
		db:                db,
		sessionBookkeeper: sessionBookkeeper,
	}
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
	return fmt.Sprintf("%s_raw", s.sessionID)
}

func (s *SqliteSession) WriteLogLine(ctx context.Context, payload WriteLogLinePayload) error {
	const insertTmpl = `INSERT INTO %s (ts, lines) VALUES (?, ?)`

	stmt := fmt.Sprintf(insertTmpl, s.rawTableName())
	if _, err := s.db.ExecContext(ctx, stmt, payload.Timestamp, payload.Line); err != nil {
		return fmt.Errorf("failed to insert log line: %w", err)
	}

	return nil
}
