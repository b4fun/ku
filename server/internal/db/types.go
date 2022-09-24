package db

import (
	"context"
	"time"

	v1 "github.com/b4fun/ku/protos/api/v1"
)

type WriteLogLinesBatchPayload struct {
	Timestamp time.Time
	Lines     []string
}

type Session interface {
	WriteLogLinesBatch(ctx context.Context, payload WriteLogLinesBatchPayload) error
}

type CreateSessionOpts struct {
	// Prefix specifies the session name prefix.
	Prefix string

	// Name - optional name for the session. Fallback to session id if empty.
	Name string

	// ReuseExisting - if true, will try to reuse existing session with the same prefix.
	// If there are multiple existing sessions with the same prefix, the first one
	// in ascending alphabetical order will be used.
	ReuseExisting bool
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
