package db

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
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

// ref: databaseTypeConvSqlite
func sqliteDatabaseTypeToColumnType(t string) v1.TableColumn_Type {
	if strings.Contains(t, "INT") {
		return v1.TableColumn_TYPE_INT64
	}
	if t == "CLOB" || t == "TEXT" ||
		strings.Contains(t, "CHAR") {
		return v1.TableColumn_TYPE_STRING
	}
	if t == "BLOB" {
		return v1.TableColumn_TYPE_STRING
	}
	if t == "REAL" || t == "FLOAT" ||
		strings.Contains(t, "DOUBLE") {
		return v1.TableColumn_TYPE_REAL
	}
	if t == "DATE" || t == "DATETIME" ||
		t == "TIMESTAMP" {
		return v1.TableColumn_TYPE_DATE_TIME
	}
	if t == "NUMERIC" ||
		strings.Contains(t, "DECIMAL") {
		return v1.TableColumn_TYPE_REAL
	}
	if t == "BOOLEAN" {
		return v1.TableColumn_TYPE_BOOL
	}

	return v1.TableColumn_TYPE_UNSPECIFIED
}

func sqlColumnTypesToColumnSchema(
	sqlColumnTypes []*sql.ColumnType,
	values map[string]interface{},
) []*v1.TableColumn {
	var rv []*v1.TableColumn

	for _, sqlColumnType := range sqlColumnTypes {
		columnType := sqliteDatabaseTypeToColumnType(sqlColumnType.DatabaseTypeName())

		if columnType == v1.TableColumn_TYPE_UNSPECIFIED {
			// try infer from value for computed fields
			// NOTE: current sqlite driver implementation treats computed column as UNSPECIFIED.
			//       For such column, we fallback to inferring by value.
			v, exists := values[sqlColumnType.Name()]
			if exists {
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
			} else {
				// fallback to string type for presenting
				columnType = v1.TableColumn_TYPE_STRING
			}
		}

		rv = append(rv, &v1.TableColumn{
			Key:  sqlColumnType.Name(),
			Type: columnType,
		})
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
		// FIXME(hbc): the type of the column value needs to be inferred from the table and query
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

	rv := &v1.QueryTableResponse{}

	rows, err := qs.db.QueryxContext(ctx, q)
	if err != nil {
		return nil, fmt.Errorf("query failed: %w", err)
	}
	defer rows.Close()

	columnTypes, err := rows.ColumnTypes()
	if err != nil {
		return nil, fmt.Errorf("reflect columns type failed: %w", err)
	}
	rv.Columns = sqlColumnTypesToColumnSchema(columnTypes, map[string]interface{}{})

	firstRowProcessed := false
	for rows.Next() {
		dbValues := map[string]interface{}{}
		if err := rows.MapScan(dbValues); err != nil {
			return nil, fmt.Errorf("scan value: %w", err)
		}

		if !firstRowProcessed {
			// attempts to override with row value
			rv.Columns = sqlColumnTypesToColumnSchema(columnTypes, dbValues)
			firstRowProcessed = true
		}

		row, err := newTableRow(dbValues)
		if err != nil {
			return nil, fmt.Errorf("encode value: %w", err)
		}
		rv.Rows = append(rv.Rows, row)
	}

	return rv, nil
}
