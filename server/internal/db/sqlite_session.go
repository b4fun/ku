package db

import (
	"context"
	"fmt"

	v1 "github.com/b4fun/ku/protos/api/v1"
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

const tableNameRaw = "raw"

func (s *SqliteSession) bootstrap(ctx context.Context) error {
	const dropTableTmpl = `DROP TABLE IF EXISTS %s`

	const createTableTmpl = `
CREATE TABLE %s (
	ts datetime,
	lines text
);
`
	rawTableName := s.dbTableName(tableNameRaw)

	if _, err := s.db.ExecContext(ctx, fmt.Sprintf(dropTableTmpl, rawTableName)); err != nil {
		return fmt.Errorf("drop raw table %q: %w", rawTableName, err)
	}

	if _, err := s.db.ExecContext(ctx, fmt.Sprintf(createTableTmpl, rawTableName)); err != nil {
		return fmt.Errorf("create raw table %q: %w", rawTableName, err)
	}

	if err := s.sessionBookkeeper.CreateSessionTable(
		ctx,
		s.sessionID,
		&v1.TableSchema{
			Id:   rawTableName,
			Name: tableNameRaw,
			Type: v1.TableSchema_TYPE_RAW,
			Columns: []*v1.TableColumn{
				{
					Key:  "ts",
					Type: v1.TableColumn_TYPE_DATE_TIME,
				},
				{
					Key:  "lines",
					Type: v1.TableColumn_TYPE_STRING,
				},
			},
		},
	); err != nil {
		return fmt.Errorf("bookkeep raw table %q: %w", rawTableName, err)
	}

	return nil
}

func (s *SqliteSession) dbTableName(tableName string) string {
	return fmt.Sprintf("%s_%s", s.sessionID, tableName)
}

func (s *SqliteSession) WriteLogLine(ctx context.Context, payload WriteLogLinePayload) error {
	const insertTmpl = `INSERT INTO %s (ts, lines) VALUES (?, ?)`

	stmt := fmt.Sprintf(insertTmpl, s.dbTableName(tableNameRaw))
	if _, err := s.db.ExecContext(ctx, stmt, payload.Timestamp, payload.Line); err != nil {
		return fmt.Errorf("failed to insert log line: %w", err)
	}

	return nil
}
