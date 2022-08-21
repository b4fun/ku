package db

import (
	"strings"

	v1 "github.com/b4fun/ku/protos/api/v1"
)

type queryBuilder struct {
	query *v1.TableQuery
}

func (q *queryBuilder) SourceTable() string {
	return q.query.Table
}

func (q *queryBuilder) CompileColumns() string {
	if len(q.query.Columns) < 1 {
		return "*"
	}

	return strings.Join(q.query.Columns, ", ")
}

func (q *queryBuilder) CompileWhereClauses() string {
	if len(q.query.WhereClauses) < 1 {
		return ""
	}

	return strings.Join(q.query.WhereClauses, " AND ")
}

func (q *queryBuilder) CompileOrderByClauses() string {
	if len(q.query.OrderByClauses) < 1 {
		return ""
	}

	return strings.Join(q.query.OrderByClauses, ", ")
}

func newQueryBuilder(payload *QueryPayload) *queryBuilder {
	return &queryBuilder{
		query: payload.Query,
	}
}
