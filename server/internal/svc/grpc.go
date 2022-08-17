package svc

import (
	"github.com/b4fun/ku/server/internal/base"
	"github.com/b4fun/ku/server/internal/db"
	"github.com/go-logr/logr"
	"google.golang.org/grpc"
)

type grpcServerParams struct {
	logger       logr.Logger
	dbProvider   db.Provider
	queryService base.QueryService
}

func newGRPCServer(params *grpcServerParams) *grpc.Server {
	grpcServer := grpc.NewServer()

	apiServerParams{
		logger:       params.logger,
		dbProvider:   params.dbProvider,
		queryService: params.queryService,
	}.createAndRegister(grpcServer)

	return grpcServer
}
