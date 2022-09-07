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

// ref: https://www.sqlite.org/pragma.html#pragma_table_info
type sqlitePragmaTableInfoColumn struct {
	Name string `db:"name"`
	Type string `db:"type"`
}

func (col sqlitePragmaTableInfoColumn) ToTableColumn() *v1.TableColumn {
	return &v1.TableColumn{
		Key:  col.Name,
		Type: sqliteDatabaseTypeToColumnType(col.Type),
	}
}

func (s *SqliteSession) CreateParsedTable(ctx context.Context, opts *CreateParsedTableOpts) error {
	const dropViewTmpl = `DROP VIEW IF EXISTS %s`
	const createViewTmpl = `CREATE VIEW %s AS %s`
	const getViewInfoQueryTmpl = `SELECT name, type FROM pragma_table_info('%s') ORDER BY cid ASC`

	if opts.SQL == "" {
		return fmt.Errorf("sql is required")
	}
	if opts.TableName == "" {
		return fmt.Errorf("table name is required")
	}

	parsedTableName := s.dbTableName(opts.TableName)

	if _, err := s.db.ExecContext(ctx, fmt.Sprintf(dropViewTmpl, parsedTableName)); err != nil {
		return fmt.Errorf("drop view %q: %w", parsedTableName, err)
	}

	if _, err := s.db.ExecContext(ctx, fmt.Sprintf(createViewTmpl, parsedTableName, opts.SQL)); err != nil {
		return fmt.Errorf("create view %q: %w", parsedTableName, err)
	}

	var tableInfoColumns []sqlitePragmaTableInfoColumn
	if err := s.db.SelectContext(
		ctx, &tableInfoColumns,
		fmt.Sprintf(getViewInfoQueryTmpl, parsedTableName),
	); err != nil {
		return fmt.Errorf("get view info %q: %w", parsedTableName, err)
	}

	var tableColumns []*v1.TableColumn
	for _, dbCol := range tableInfoColumns {
		tableColumns = append(tableColumns, dbCol.ToTableColumn())
	}

	if err := s.sessionBookkeeper.CreateSessionTable(
		ctx,
		s.sessionID,
		&v1.TableSchema{
			Id:      parsedTableName,
			Name:    opts.TableName,
			Type:    v1.TableSchema_TYPE_PARSED,
			Columns: tableColumns,
		},
	); err != nil {
		return fmt.Errorf("bookkeep parsed table %q: %w", parsedTableName, err)
	}

	return nil
}
