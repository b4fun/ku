package svc

import (
	"github.com/b4fun/ku/server/internal/db"
	"github.com/go-logr/logr"
	"google.golang.org/grpc"
)

type grpcServerParams struct {
	logger       logr.Logger
	queryService db.QueryService
	sessionRepo  db.SessionRepository
}

func newGRPCServer(params *grpcServerParams) *grpc.Server {
	grpcServer := grpc.NewServer()

	apiServerParams{
		logger:       params.logger,
		queryService: params.queryService,
		sessionRepo:  params.sessionRepo,
	}.createAndRegister(grpcServer)

	return grpcServer
}
