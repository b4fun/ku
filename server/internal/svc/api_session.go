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
	sessions, err := s.sessionRepo.ListSessions(ctx)
	if err != nil {
		s.logger.Error(err, "sessionRepo.ListSessions")
		return nil, status.Error(codes.Internal, err.Error())
	}

	rv := &v1.ListSessionsResponse{Sessions: sessions}
	return rv, nil
}

func (s *apiServer) validateUpdateSessionPayload(
	session *v1.Session,
) (*v1.Session, error) {
	if session == nil {
		return nil, status.Error(codes.InvalidArgument, "session is required")
	}

	if session.Id == "" {
		return nil, status.Error(codes.InvalidArgument, "session id is required")
	}

	if session.Name == "" {
		return nil, status.Error(codes.InvalidArgument, "session name is required")
	}

	return session, nil
}

func (s *apiServer) UpdateSession(
	ctx context.Context,
	req *v1.UpdateSessionRequest,
) (*v1.UpdateSessionResponse, error) {
	updatePayload, err := s.validateUpdateSessionPayload(req.Session)
	if err != nil {
		return nil, err
	}

	sessionToUpdate, err := s.sessionRepo.GetSessionByID(ctx, updatePayload.Id)
	if err != nil {
		s.logger.Error(err, "sessionRepo.GetSessionByID")
		return nil, status.Error(codes.Internal, err.Error())
	}

	s.logger.V(8).Info(
		"update session",
		"session.id", sessionToUpdate.Id,
		"session.nameOriginal", sessionToUpdate.Name,
		"session.nameNew", updatePayload.Name,
	)
	sessionToUpdate.Name = updatePayload.Name

	if err := s.sessionRepo.UpdateSession(ctx, sessionToUpdate); err != nil {
		s.logger.Error(err, "sessionRepo.UpdateSession")
		return nil, status.Error(codes.Internal, err.Error())
	}

	sessionUpdated, err := s.sessionRepo.GetSessionByID(ctx, sessionToUpdate.Id)
	if err != nil {
		s.logger.Error(err, "sessionRepo.GetSessionByID")
		return nil, status.Error(codes.Internal, err.Error())
	}

	resp := &v1.UpdateSessionResponse{Session: sessionUpdated}
	return resp, nil
}
