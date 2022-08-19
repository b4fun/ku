package db

import (
	"context"
	"encoding/json"
	"fmt"

	v1 "github.com/b4fun/ku/protos/api/v1"
	"github.com/b4fun/ku/server/internal/base"
	"github.com/jmoiron/sqlx"
)

type SqliteQueryService struct {
	db *sqlx.DB
}

var _ base.QueryService = (*SqliteQueryService)(nil)

func newTableRow(dbValues map[string]interface{}) (*v1.TableRow, error) {
	rv := &v1.TableRow{}

	for k, v := range dbValues {
		vv, err := json.Marshal(v)
		if err != nil {
			return nil, fmt.Errorf("marshal value %q: %w", k, err)
		}
		rv.Columns = append(rv.Columns, &v1.TableKeyValue{
			Key:   k,
			Value: vv,
		})
	}

	return rv, nil
}

func (qs *SqliteQueryService) Query(
	ctx context.Context,
	req *base.QueryRequest,
) (*v1.QueryTableResponse, error) {
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

	rv := &v1.QueryTableResponse{}
	for rows.Next() {
		dbValues := map[string]interface{}{}
		if err := rows.MapScan(dbValues); err != nil {
			return nil, fmt.Errorf("scan value: %w", err)
		}
		row, err := newTableRow(dbValues)
		if err != nil {
			return nil, fmt.Errorf("encode value: %w", err)
		}
		rv.Rows = append(rv.Rows, row)
	}

	return rv, nil
}
