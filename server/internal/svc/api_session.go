package svc

import (
	"context"

	v1 "github.com/b4fun/ku/protos/api/v1"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (s *apiServer) ListSessions(
	ctx context.Context,
	req *v1.ListSessionsRequest,
) (*v1.ListSessionsResponse, error) {
	sessions, err := s.dbProvider.ListSessions(ctx)
	if err != nil {
		s.logger.Error(err, "dbProvider.ListSessionIDs")
		return nil, status.Error(codes.Internal, err.Error())
	}

	rv := &v1.ListSessionsResponse{Sessions: sessions}
	return rv, nil
}
