package db

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/b4fun/ku/server/internal/base"
	"github.com/jmoiron/sqlx"
)

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
