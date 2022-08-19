package db

import (
	"context"
	"fmt"

	v1 "github.com/b4fun/ku/protos/api/v1"
	"github.com/jmoiron/sqlx"
	"github.com/lithammer/shortuuid"
	"google.golang.org/protobuf/proto"
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
	table_protos blob
);
`, bk.tableNameSessionTable),
		},
		{
			TableName: bk.tableNameSessionTable,
			DDL: fmt.Sprintf(`
CREATE UNIQUE INDEX IF NOT EXISTS %s_session_id_table_name ON %s (session_id, table_name);
`, bk.tableNameSessionTable, bk.tableNameSessionTable),
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
INSERT INTO %s (session_id, table_name, table_protos)
VALUES (?, ?, ?)
ON CONFLICT(session_id, table_name)
DO UPDATE SET table_protos = excluded.table_protos
`

	tableProtos, err := proto.Marshal(schema)
	if err != nil {
		return fmt.Errorf("encode table protos: %w", err)
	}

	if _, err := bk.db.ExecContext(
		ctx,
		fmt.Sprintf(insertStmtTmpl, bk.tableNameSessionTable),
		sessionID, schema.Name, tableProtos,
	); err != nil {
		return fmt.Errorf("insert table to session %q: %w", sessionID, err)
	}

	return nil
}

type dbSessionTable struct {
	SessionID   string `db:"session_id"`
	TableName   string `db:"table_name"`
	TableProtos []byte `db:"table_protos"`
}

// ListSessions lists all known sessions.
func (bk *sqliteSessionBookkeeper) ListSessions(
	ctx context.Context,
) ([]*v1.Session, error) {
	const listSessionIDsQueryTmpl = `
SELECT session_id from %s order by session_id asc
`
	var sessionIDs []string
	if err := bk.db.SelectContext(
		ctx,
		&sessionIDs,
		fmt.Sprintf(listSessionIDsQueryTmpl, bk.tableNameSession),
	); err != nil {
		return nil, fmt.Errorf("list session ids: %w", err)
	}

	const listSessionTablesQueryTmpl = `
SELECT session_id, table_name, table_protos from %s
`
	var sessionTables []dbSessionTable
	if err := bk.db.SelectContext(
		ctx,
		&sessionTables,
		fmt.Sprintf(listSessionTablesQueryTmpl, bk.tableNameSessionTable),
	); err != nil {
		return nil, fmt.Errorf("list session tables: %w", err)
	}

	tablesBySessionID := map[string][]*v1.TableSchema{}
	for _, dbEntry := range sessionTables {
		table := new(v1.TableSchema)
		if err := proto.Unmarshal(dbEntry.TableProtos, table); err != nil {
			err := fmt.Errorf(
				"decode table protos for table %s/%s: %w",
				dbEntry.SessionID, dbEntry.TableName, err,
			)
			return nil, err
		}
		tablesBySessionID[dbEntry.SessionID] = append(
			tablesBySessionID[dbEntry.SessionID],
			table,
		)
	}

	rv := make([]*v1.Session, 0, len(sessionIDs))
	for _, sessionID := range sessionIDs {
		session := &v1.Session{
			Id: sessionID,
		}

		if tables, ok := tablesBySessionID[sessionID]; ok {
			session.Tables = tables
		}

		rv = append(rv, session)
	}

	return rv, nil
}
