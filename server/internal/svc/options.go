package svc

import (
	"context"

	"github.com/go-logr/logr"
)

type Options struct {
	Logger   logr.Logger
	HTTPAddr string
}

func (opts *Options) defaults() error {
	if opts.Logger.GetSink() == nil {
		opts.Logger = logr.Discard()
	}

	if opts.HTTPAddr == "" {
		opts.HTTPAddr = ":4000"
	}

	return nil
}

type Runnable interface {
	Start(context.Context) error
}

func New(opts *Options) (Runnable, error) {
	if err := opts.defaults(); err != nil {
		return nil, err
	}

	grpcServer := newGRPCServer(&grpcServerParams{
		logger: opts.Logger.WithName("grpc-server"),
	})
	httpServer := newHTTPServer(&httpServerParams{
		logger:     opts.Logger.WithName("http-server"),
		addr:       opts.HTTPAddr,
		grpcServer: grpcServer,
	})

	return httpServer, nil
}
