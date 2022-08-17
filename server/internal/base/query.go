package base

import (
	"context"
	"encoding/json"
	"strings"

	v1 "github.com/b4fun/ku/protos/api/v1"
)

type SQLQuery struct {
	*v1.TableQuery
}

func (q SQLQuery) CompileColumns() string {
	if len(q.Columns) < 1 {
		return "*"
	}

	return strings.Join(q.Columns, ", ")
}

func (q SQLQuery) CompileWhereClauses() string {
	if len(q.WhereClauses) < 1 {
		return ""
	}

	return strings.Join(q.WhereClauses, " AND ")
}

func (q SQLQuery) CompileOrderByClauses() string {
	if len(q.OrderByClauses) < 1 {
		return ""
	}

	return strings.Join(q.OrderByClauses, ", ")
}

type TableRow struct {
	Values map[string]json.RawMessage `json:"values"`
}

type QueryRequest struct {
	Query SQLQuery `json:"query"`
}

func NewQueryRequest(q *v1.TableQuery) *QueryRequest {
	return &QueryRequest{
		Query: SQLQuery{
			TableQuery: q,
		},
	}
}

type QueryResponse struct {
	Rows []TableRow `json:"rows"`
}

type QueryService interface {
	Query(ctx context.Context, req *QueryRequest) (*QueryResponse, error)
}
