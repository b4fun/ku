package db

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/b4fun/ku/server/internal/svc"
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

func (p *SqliteProvider) CreateQueryService() (svc.QueryService, error) {
	rv := &SqliteQueryService{db: p.db}

	return rv, nil
}

type SqliteQueryService struct {
	db *sqlx.DB
}

var _ svc.QueryService = (*SqliteQueryService)(nil)

func newTableRow(vals map[string]interface{}) (*svc.TableRow, error) {
	rv := &svc.TableRow{
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
	req *svc.QueryRequest,
) (*svc.QueryResponse, error) {
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

	rv := &svc.QueryResponse{}
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
