package db

import (
	"context"
	"time"

	v1 "github.com/b4fun/ku/protos/api/v1"
)

type WriteLogLinePayload struct {
	Timestamp time.Time
	Line      string
}

type Session interface {
	WriteLogLine(ctx context.Context, payload WriteLogLinePayload) error
}

type CreateSessionOpts struct {
	Prefix string
}

type CreateParsedTableOpts struct {
	Session   *v1.Session
	TableName string
	SQL       string
}

type Provider interface {
	CreateSession(ctx context.Context, opts *CreateSessionOpts) (string, Session, error)
	CreateParsedTable(ctx context.Context, opts *CreateParsedTableOpts) error

	GetQueryService() (QueryService, error)

	GetSessionRepository() (SessionRepository, error)
}

type QueryService interface {
	QueryTable(
		ctx context.Context,
		payload *v1.QueryTableRequest,
	) (*v1.QueryTableResponse, error)
}

type SessionRepository interface {
	ListSessions(ctx context.Context) ([]*v1.Session, error)
	GetSessionByID(ctx context.Context, sessionID string) (*v1.Session, error)
	UpdateSession(ctx context.Context, session *v1.Session) error
}
