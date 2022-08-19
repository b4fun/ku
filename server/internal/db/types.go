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

type Provider interface {
	CreateSession(ctx context.Context, opts *CreateSessionOpts) (string, Session, error)

	ListSessions(ctx context.Context) ([]*v1.Session, error)
}
