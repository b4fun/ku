package db

import (
	"context"
	"fmt"
	"time"

	v1 "github.com/b4fun/ku/protos/api/v1"
	"github.com/jmoiron/sqlx"
	"google.golang.org/protobuf/types/known/timestamppb"
	"google.golang.org/protobuf/types/known/wrapperspb"
)

type SqliteQueryService struct {
	db *sqlx.DB
}

var _ QueryService = (*SqliteQueryService)(nil)

func inferTableColumnSchema(
	dbValues map[string]interface{},
) []*v1.TableColumn {
	var keys []string
	byKey := map[string]*v1.TableColumn{}

	for k, v := range dbValues {
		if _, exists := byKey[k]; exists {
			continue
		}

		// TODO(hbc): the type of the column value needs to be inferred from the table and query
		// fallback to string for unknown value for now
		columnType := v1.TableColumn_TYPE_STRING

		if v != nil {
			switch v.(type) {
			case bool:
				columnType = v1.TableColumn_TYPE_BOOL
			case int:
				columnType = v1.TableColumn_TYPE_INT64
			case int32:
				columnType = v1.TableColumn_TYPE_INT64
			case int64:
				columnType = v1.TableColumn_TYPE_INT64
			case float32:
				columnType = v1.TableColumn_TYPE_REAL
			case float64:
				columnType = v1.TableColumn_TYPE_REAL
			case string:
				columnType = v1.TableColumn_TYPE_STRING
			case time.Time:
				columnType = v1.TableColumn_TYPE_DATE_TIME
			}
		}

		byKey[k] = &v1.TableColumn{
			Key:  k,
			Type: columnType,
		}
		keys = append(keys, k)
	}

	var rv []*v1.TableColumn

	for _, k := range keys {
		rv = append(rv, byKey[k])
	}
	return rv
}

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

func (qs *SqliteQueryService) QueryTable(
	ctx context.Context,
	payload *v1.QueryTableRequest,
) (*v1.QueryTableResponse, error) {
	// TODO: we blindly trust the sql input here :)
	q := payload.Sql

	rows, err := qs.db.QueryxContext(ctx, q)
	if err != nil {
		return nil, fmt.Errorf("query failed: %w", err)
	}
	defer rows.Close()

	rv := &v1.QueryTableResponse{}
	tableColumnSchemaInferred := false
	for rows.Next() {
		dbValues := map[string]interface{}{}
		if err := rows.MapScan(dbValues); err != nil {
			return nil, fmt.Errorf("scan value: %w", err)
		}

		if !tableColumnSchemaInferred {
			rv.Columns = inferTableColumnSchema(dbValues)
			tableColumnSchemaInferred = true
		}

		row, err := newTableRow(dbValues)
		if err != nil {
			return nil, fmt.Errorf("encode value: %w", err)
		}
		rv.Rows = append(rv.Rows, row)
	}

	return rv, nil
}
