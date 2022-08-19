package db

import (
	"context"
	"fmt"

	v1 "github.com/b4fun/ku/protos/api/v1"
	"github.com/jmoiron/sqlx"
	"github.com/lithammer/shortuuid"
)

type sqliteSessionBookkeeper struct {
	db                    *sqlx.DB
	tableNameSession      string
	tableNameSessionTable string
}

func newSqliteSessionBookkeeper(db *sqlx.DB) *sqliteSessionBookkeeper {
	return &sqliteSessionBookkeeper{
		db:                    db,
		tableNameSession:      "ku_session_metadata",
		tableNameSessionTable: "ku_session_table_metadata",
	}
}

// Bootstrap bootstraps the session book keeper.
func (bk *sqliteSessionBookkeeper) Bootstrap(ctx context.Context) error {
	tableDDLs := []struct {
		TableName string
		DDL       string
	}{
		{
			TableName: bk.tableNameSession,
			DDL: fmt.Sprintf(`
CREATE TABLE IF NOT EXISTS %s (
	session_id text
);
`, bk.tableNameSession),
		},
		{
			TableName: bk.tableNameSessionTable,
			DDL: fmt.Sprintf(`
CREATE TABLE IF NOT EXISTS %s (
	session_id text,
	table_name text,
	table_type integer
);
`, bk.tableNameSessionTable),
		},
	}
	for _, ddl := range tableDDLs {
		if _, err := bk.db.ExecContext(ctx, ddl.DDL); err != nil {
			return fmt.Errorf("create table %q: %w", ddl.TableName, err)
		}
	}

	return nil
}

// CreateSession book keeps a new session and returns its id.
func (bk *sqliteSessionBookkeeper) CreateSession(
	ctx context.Context,
	prefix string,
) (string, error) {
	const insertStmtTmpl = `
INSERT INTO %s (session_id) VALUES (?)
`

	sessionID := fmt.Sprintf("%s_%s", prefix, shortuuid.New())
	if _, err := bk.db.ExecContext(
		ctx,
		fmt.Sprintf(insertStmtTmpl, bk.tableNameSession),
		sessionID,
	); err != nil {
		return "", fmt.Errorf("insert session id: %w", err)
	}

	return sessionID, nil
}

// CreateSessionTable creates a session table entry.
func (bk *sqliteSessionBookkeeper) CreateSessionTable(
	ctx context.Context,
	sessionID string,
	schema *v1.TableSchema,
) error {
	const insertStmtTmpl = `
INSERT INTO %s (session_id, table_name, table_type) VALUES (?, ?, ?)
`

	if _, err := bk.db.ExecContext(
		ctx,
		insertStmtTmpl,
		sessionID, schema.Name, schema.Type.Number(),
	); err != nil {
		return fmt.Errorf("insert table to session %q: %w", sessionID, err)
	}

	return nil
}

// ListSessionIDs lists all known session ids.
func (bk *sqliteSessionBookkeeper) ListSessionIDs(
	ctx context.Context,
) ([]string, error) {
	const listQueryTmpl = `
SELECT session_id from %s order by session_id asc
`
	var rv []string
	err := bk.db.SelectContext(
		ctx,
		&rv,
		fmt.Sprintf(listQueryTmpl, bk.tableNameSession),
	)
	if err != nil {
		return nil, fmt.Errorf("query session ids: %w", err)
	}

	return rv, nil
}
