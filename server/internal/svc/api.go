package svc

import (
	v1 "github.com/b4fun/ku/protos/api/v1"
	"github.com/go-logr/logr"
	"google.golang.org/grpc"
)

type apiServerParams struct {
	logger logr.Logger
}

func (p apiServerParams) createAndRegister(s *grpc.Server) {
	rv := &apiServer{
		logger: p.logger.WithName("api"),
	}

	v1.RegisterAPIServiceServer(s, rv)
}

type apiServer struct {
	v1.UnimplementedAPIServiceServer

	logger logr.Logger
}
