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
	session_id text,
	session_protos blob
);
`, bk.tableNameSession),
		},
		{
			TableName: bk.tableNameSession,
			DDL: fmt.Sprintf(`
CREATE UNIQUE INDEX IF NOT EXISTS %s_session_id ON %s (session_id);
`, bk.tableNameSession, bk.tableNameSession),
		},
		{
			TableName: bk.tableNameSessionTable,
			DDL: fmt.Sprintf(`
CREATE TABLE IF NOT EXISTS %s (
	session_id text,
	table_id text,
	table_protos blob
);
`, bk.tableNameSessionTable),
		},
		{
			TableName: bk.tableNameSessionTable,
			DDL: fmt.Sprintf(`
CREATE UNIQUE INDEX IF NOT EXISTS %s_session_id_table_id ON %s (session_id, table_id);
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
	name string,
) (string, error) {
	const insertStmtTmpl = `
INSERT INTO %s (session_id, session_protos) VALUES (?, ?)
`

	session := &v1.Session{
		Id:   fmt.Sprintf("%s_%s", prefix, shortuuid.New()),
		Name: name,
	}
	if session.Name == "" {
		session.Name = session.Id
	}
	sessionProtos, err := proto.Marshal(session)
	if err != nil {
		return "", fmt.Errorf("encode session protos: %w", err)
	}

	if _, err := bk.db.ExecContext(
		ctx,
		fmt.Sprintf(insertStmtTmpl, bk.tableNameSession),
		session.Id, sessionProtos,
	); err != nil {
		return "", fmt.Errorf("insert session: %w", err)
	}

	return session.Id, nil
}

func (bk *sqliteSessionBookkeeper) GetSessionByID(
	ctx context.Context,
	id string,
) (*v1.Session, error) {
	return loadSessionTableForSession(
		ctx,
		func(ctx context.Context) (*v1.Session, error) {
			const selectQueryTmpl = `SELECT * FROM %s WHERE session_id = ?`

			dbSession := new(dbSession)
			if err := bk.db.GetContext(
				ctx,
				dbSession,
				fmt.Sprintf(selectQueryTmpl, bk.tableNameSession),
				id,
			); err != nil {
				return nil, fmt.Errorf("get session: %w", err)
			}

			return dbSession.ToProto()
		},
		bk.listDBSessionTablesBySessions,
	)
}

func (bk *sqliteSessionBookkeeper) UpdateSession(
	ctx context.Context,
	session *v1.Session,
) error {
	const updateStmtTmpl = `
UPDATE %s SET session_protos = ? WHERE session_id = ?
`

	sessionProtos, err := proto.Marshal(session)
	if err != nil {
		return fmt.Errorf("encode session protos: %w", err)
	}

	if _, err := bk.db.ExecContext(
		ctx,
		fmt.Sprintf(updateStmtTmpl, bk.tableNameSession),
		sessionProtos, session.Id,
	); err != nil {
		return fmt.Errorf("update session %q: %w", session.Id, err)
	}

	return nil
}

// CreateSessionTable creates a session table entry.
func (bk *sqliteSessionBookkeeper) CreateSessionTable(
	ctx context.Context,
	sessionID string,
	schema *v1.TableSchema,
) error {
	const insertStmtTmpl = `
INSERT INTO %s (session_id, table_id, table_protos)
VALUES (?, ?, ?)
ON CONFLICT(session_id, table_id)
DO UPDATE SET table_protos = excluded.table_protos
`

	tableProtos, err := proto.Marshal(schema)
	if err != nil {
		return fmt.Errorf("encode table protos: %w", err)
	}

	if _, err := bk.db.ExecContext(
		ctx,
		fmt.Sprintf(insertStmtTmpl, bk.tableNameSessionTable),
		sessionID, schema.Id, tableProtos,
	); err != nil {
		return fmt.Errorf("insert table to session %q: %w", sessionID, err)
	}

	return nil
}

type dbSession struct {
	SessionID     string `db:"session_id"`
	SessionProtos []byte `db:"session_protos"`
}

func (d *dbSession) ToProto() (*v1.Session, error) {
	session := new(v1.Session)
	if err := proto.Unmarshal(d.SessionProtos, session); err != nil {
		return nil, fmt.Errorf("unmarshal session %q: %w", d.SessionID, err)
	}
	session.Id = d.SessionID
	session.Tables = nil // use db records as source of truth

	return session, nil
}

type dbSessionTable struct {
	SessionID   string `db:"session_id"`
	TableID     string `db:"table_id"`
	TableProtos []byte `db:"table_protos"`
}

func (bk *sqliteSessionBookkeeper) listDBSessionTablesBySessions(
	ctx context.Context,
	sessions []*v1.Session,
) ([]dbSessionTable, error) {
	const listQueryTmpl = `SELECT * from %s WHERE session_id in (?)`

	if len(sessions) < 1 {
		return nil, nil
	}

	sessionIDs := make([]string, len(sessions))
	for i, session := range sessions {
		sessionIDs[i] = session.Id
	}

	q, args, err := sqlx.In(
		fmt.Sprintf(listQueryTmpl, bk.tableNameSessionTable),
		sessionIDs,
	)
	if err != nil {
		return nil, fmt.Errorf("build query: %w", err)
	}

	var dbSessionTables []dbSessionTable
	if err := bk.db.SelectContext(
		ctx,
		&dbSessionTables,
		q, args...,
	); err != nil {
		return nil, fmt.Errorf("list session tables: %w", err)
	}

	return dbSessionTables, nil
}

// ListSessions lists all known sessions.
func (bk *sqliteSessionBookkeeper) ListSessions(
	ctx context.Context,
) ([]*v1.Session, error) {
	return loadSessionTables(
		ctx,
		func(ctx context.Context) ([]*v1.Session, error) {
			const listQueryTmpl = `SELECT * from %s order by session_id asc`

			var dbSessions []dbSession
			if err := bk.db.SelectContext(
				ctx,
				&dbSessions,
				fmt.Sprintf(listQueryTmpl, bk.tableNameSession),
			); err != nil {
				return nil, fmt.Errorf("list sessions: %w", err)
			}

			if len(dbSessions) < 1 {
				return nil, nil
			}

			sessions := make([]*v1.Session, len(dbSessions))
			for i, dbSession := range dbSessions {
				session, err := dbSession.ToProto()
				if err != nil {
					return nil, err
				}
				sessions[i] = session
			}

			return sessions, nil
		},
		bk.listDBSessionTablesBySessions,
	)
}
