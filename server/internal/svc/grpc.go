package svc

import (
	"github.com/go-logr/logr"
	"google.golang.org/grpc"
)

type grpcServerParams struct {
	logger logr.Logger
}

func newGRPCServer(params *grpcServerParams) *grpc.Server {
	grpcServer := grpc.NewServer()

	apiServerParams{
		logger: params.logger,
	}.createAndRegister(grpcServer)

	return grpcServer
}
