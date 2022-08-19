package svc

import (
	"context"

	v1 "github.com/b4fun/ku/protos/api/v1"
	"github.com/b4fun/ku/server/internal/base"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (s *apiServer) QueryTable(
	ctx context.Context,
	req *v1.QueryTableRequest,
) (*v1.QueryTableResponse, error) {
	rv, err := s.queryService.Query(
		ctx,
		base.NewQueryRequest(req.Query),
	)
	if err != nil {
		s.logger.Error(err, "queryService.Query")
		return nil, status.Error(codes.Internal, err.Error())
	}

	return rv, nil
}
