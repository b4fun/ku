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
	sessionIDs, err := s.dbProvider.ListSessionIDs(ctx)
	if err != nil {
		s.logger.Error(err, "dbProvider.ListSessionIDs")
		return nil, status.Error(codes.Internal, err.Error())
	}

	rv := &v1.ListSessionsResponse{}
	for _, sessionID := range sessionIDs {
		rv.Sessions = append(rv.Sessions, &v1.Session{
			Id: sessionID,
		})
	}
	return rv, nil
}
