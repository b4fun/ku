package svc

import (
	"github.com/b4fun/ku/server/internal/db"
	"github.com/go-logr/logr"
	"google.golang.org/grpc"
)

type grpcServerParams struct {
	logger     logr.Logger
	dbProvider db.Provider
}

func newGRPCServer(params *grpcServerParams) *grpc.Server {
	grpcServer := grpc.NewServer()

	apiServerParams{
		logger: params.logger,
	}.createAndRegister(grpcServer)

	return grpcServer
}
