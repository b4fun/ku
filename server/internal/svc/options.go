package svc

import (
	"fmt"

	"github.com/b4fun/ku/server/internal/base"
	"github.com/b4fun/ku/server/internal/db"
	"github.com/go-logr/logr"
)

type Options struct {
	Logger       logr.Logger
	HTTPAddr     string
	DBProvider   db.Provider
	QueryService db.QueryService
	SessionRepo  db.SessionRepository
}

func (opts *Options) defaults() error {
	if opts.DBProvider == nil {
		return fmt.Errorf(".DBProvider is required")
	}
	if opts.QueryService == nil {
		return fmt.Errorf(".QueryService is required")
	}
	if opts.SessionRepo == nil {
		return fmt.Errorf(".SessionRepo is required")
	}

	if opts.Logger.GetSink() == nil {
		opts.Logger = logr.Discard()
	}

	if opts.HTTPAddr == "" {
		opts.HTTPAddr = ":4000"
	}

	return nil
}

func New(opts *Options) (base.Runnable, error) {
	if err := opts.defaults(); err != nil {
		return nil, err
	}

	grpcServer := newGRPCServer(&grpcServerParams{
		logger:       opts.Logger.WithName("grpc-server"),
		dbProvider:   opts.DBProvider,
		queryService: opts.QueryService,
		sessionRepo:  opts.SessionRepo,
	})
	httpServer := newHTTPServer(&httpServerParams{
		logger:     opts.Logger.WithName("http-server"),
		addr:       opts.HTTPAddr,
		grpcServer: grpcServer,
	})

	return httpServer, nil
}
