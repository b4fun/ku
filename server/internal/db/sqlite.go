package db

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/b4fun/ku/server/internal/base"
	"github.com/jmoiron/sqlx"
	"github.com/lithammer/shortuuid"
	_ "github.com/mattn/go-sqlite3"
)

const sqliteSessionTableName = "ku_session_metadata"

type sqliteSessionBookkeeper struct {
	db               *sqlx.DB
	sessionTableName string
}

// Bootstrap bootstraps the session book keeper.
func (bk *sqliteSessionBookkeeper) Bootstrap(ctx context.Context) error {
	const createTableTmpl = `
CREATE TABLE IF NOT EXISTS %s (
	session_id text
);
`

	_, err := bk.db.ExecContext(ctx, fmt.Sprintf(createTableTmpl, bk.sessionTableName))
	if err != nil {
		return fmt.Errorf("failed to create session table: %w", err)
	}

	return nil
}

// CreateSession book keeps a new session and returns its id.
func (bk *sqliteSessionBookkeeper) CreateSession(ctx context.Context, prefix string) (string, error) {
	const insertStmtTmpl = `
INSERT INTO %s (session_id) VALUES (?)
`

	sessionID := fmt.Sprintf("%s_%s", prefix, shortuuid.New())
	if _, err := bk.db.ExecContext(
		ctx,
		fmt.Sprintf(insertStmtTmpl, bk.sessionTableName),
		sessionID,
	); err != nil {
		return "", fmt.Errorf("failed to insert session id: %w", err)
	}

	return sessionID, nil
}

// ListSessionIDs lists all known session ids.
func (bk *sqliteSessionBookkeeper) ListSessionIDs(ctx context.Context) ([]string, error) {
	const listQueryTmpl = `
SELECT session_id from %s order by session_id asc
`
	var rv []string
	err := bk.db.SelectContext(
		ctx,
		&rv,
		fmt.Sprintf(listQueryTmpl, bk.sessionTableName),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to query session ids: %w", err)
	}

	return rv, nil
}

type SqliteProvider struct {
	db *sqlx.DB

	sessionBookkeeper *sqliteSessionBookkeeper
}

var _ Provider = (*SqliteProvider)(nil)

// NewSqliteProvider creates a sqlite based provider.
func NewSqliteProvider(dbPath string) (*SqliteProvider, error) {
	db, err := sqlx.Open("sqlite3", dbPath)
	if err != nil {
		return nil, err
	}

	provider := &SqliteProvider{
		db: db,

		sessionBookkeeper: &sqliteSessionBookkeeper{
			db:               db,
			sessionTableName: sqliteSessionTableName,
		},
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

	session := &SqliteSession{
		TableName: sessionID,
		db:        p.db,
	}

	if err := session.bootstrap(ctx); err != nil {
		return sessionID, nil, fmt.Errorf("bootstrap session %s: %w", sessionID, err)
	}

	return sessionID, session, nil
}

func (p *SqliteProvider) ListSessionIDs(ctx context.Context) ([]string, error) {
	return p.sessionBookkeeper.ListSessionIDs(ctx)
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

func (p *SqliteProvider) CreateQueryService() (base.QueryService, error) {
	rv := &SqliteQueryService{db: p.db}

	return rv, nil
}

type SqliteQueryService struct {
	db *sqlx.DB
}

var _ base.QueryService = (*SqliteQueryService)(nil)

func newTableRow(vals map[string]interface{}) (*base.TableRow, error) {
	rv := &base.TableRow{
		Values: map[string]json.RawMessage{},
	}

	for k, v := range vals {
		vv, err := json.Marshal(v)
		if err != nil {
			return nil, fmt.Errorf("marshal value %q: %w", k, err)
		}
		rv.Values[k] = json.RawMessage(vv)
	}

	return rv, nil
}

func (qs *SqliteQueryService) Query(
	ctx context.Context,
	req *base.QueryRequest,
) (*base.QueryResponse, error) {
	q := fmt.Sprintf(
		"SELECT %s FROM %s",
		req.Query.CompileColumns(),
		req.Query.Table,
	)

	if whereClauses := req.Query.CompileWhereClauses(); whereClauses != "" {
		q = fmt.Sprintf("%s WHERE %s", q, whereClauses)
	}

	if orderByClauses := req.Query.CompileOrderByClauses(); orderByClauses != "" {
		q = fmt.Sprintf("%s ORDER BY %s", q, orderByClauses)
	}

	rows, err := qs.db.QueryxContext(ctx, q)
	if err != nil {
		return nil, fmt.Errorf("query failed: %w", err)
	}
	defer rows.Close()

	rv := &base.QueryResponse{}
	for rows.Next() {
		vals := map[string]interface{}{}
		if err := rows.MapScan(vals); err != nil {
			return nil, fmt.Errorf("scan value: %w", err)
		}
		row, err := newTableRow(vals)
		if err != nil {
			return nil, fmt.Errorf("encode value: %w", err)
		}
		rv.Rows = append(rv.Rows, *row)
	}

	return rv, nil
}
