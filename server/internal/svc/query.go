package svc

import (
	"context"
	"encoding/json"
	"strings"
)

type SQLQuery struct {
	Table          string   `json:"table"`
	Columns        []string `json:"columns"`
	WhereClauses   []string `json:"whereClauses"`
	OrderByClauses []string `json:"orderByClauses"`
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

type QueryResponse struct {
	Rows []TableRow `json:"rows"`
}

type QueryService interface {
	Query(ctx context.Context, req *QueryRequest) (*QueryResponse, error)
}
