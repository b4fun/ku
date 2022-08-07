package base

import "context"

type Runnable interface {
	Start(context.Context) error
}

type RunnableFunc func(context.Context) error

func (f RunnableFunc) Start(ctx context.Context) error {
	return f(ctx)
}
