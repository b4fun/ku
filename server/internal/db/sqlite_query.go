package db

import (
	"context"
	"fmt"
	"time"

	v1 "github.com/b4fun/ku/protos/api/v1"
	"github.com/b4fun/ku/server/internal/base"
	"github.com/jmoiron/sqlx"
	"google.golang.org/protobuf/types/known/timestamppb"
	"google.golang.org/protobuf/types/known/wrapperspb"
)

type SqliteQueryService struct {
	db *sqlx.DB
}

var _ base.QueryService = (*SqliteQueryService)(nil)

func newTableRow(
	dbValues map[string]interface{},
) (*v1.TableRow, error) {
	rv := &v1.TableRow{}

	for k, v := range dbValues {
		colValue := &v1.TableKeyValue{
			Key: k,
		}
		// TODO(hbc): the type of the column value needs to be inferred from the table and query
		if v != nil {
			switch v := v.(type) {
			case bool:
				colValue.ValueBool = wrapperspb.Bool(v)
			case int:
				colValue.ValueInt64 = wrapperspb.Int64(int64(v))
			case int32:
				colValue.ValueInt64 = wrapperspb.Int64(int64(v))
			case int64:
				colValue.ValueInt64 = wrapperspb.Int64(v)
			case float32:
				colValue.ValueReal = wrapperspb.Double(float64(v))
			case float64:
				colValue.ValueReal = wrapperspb.Double(v)
			case string:
				colValue.ValueString = wrapperspb.String(v)
			case time.Time:
				colValue.ValueDateTime = timestamppb.New(v)
			default:
				return nil, fmt.Errorf("unsupported type for column %q: %T", k, v)
			}
		}
		rv.Columns = append(rv.Columns, colValue)
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
