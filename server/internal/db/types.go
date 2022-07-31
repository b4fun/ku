package db

import (
	"context"
	"time"
)

type WriteLogLinePayload struct {
	Timestamp time.Time
	Line      string
}

type Session interface {
	WriteLogLine(ctx context.Context, payload WriteLogLinePayload) error
}

type Provider interface {
	CreateSession(ctx context.Context) (Session, error)
}
