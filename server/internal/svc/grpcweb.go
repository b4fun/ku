package svc

import (
	"context"
	"net/http"
	"time"

	"github.com/go-logr/logr"
	"github.com/improbable-eng/grpc-web/go/grpcweb"
	"github.com/rs/cors"
	"google.golang.org/grpc"
)

type httpServerParams struct {
	logger     logr.Logger
	addr       string
	grpcServer *grpc.Server
	uiServer   http.Handler
}

type httpServer struct {
	logger     logr.Logger
	addr       string
	grpcServer *grpc.Server
	uiServer   http.Handler
}

func newHTTPServer(params *httpServerParams) *httpServer {
	return &httpServer{
		logger:     params.logger,
		addr:       params.addr,
		grpcServer: params.grpcServer,
		uiServer:   params.uiServer,
	}
}

func (s *httpServer) Start(ctx context.Context) error {
	grpcHandler := grpcweb.WrapServer(
		s.grpcServer,
		grpcweb.WithOriginFunc(func(origin string) bool {
			return true
		}),
	)

	var httpHandler http.Handler
	httpHandler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if grpcHandler.IsGrpcWebRequest(r) {
			grpcHandler.ServeHTTP(w, r)
			return
		}

		s.uiServer.ServeHTTP(w, r)
	})
	httpHandler = cors.AllowAll().Handler(httpHandler)

	server := &http.Server{
		Addr:    s.addr,
		Handler: httpHandler,
	}

	startErrC := make(chan error, 1)
	go func() {
		startErrC <- server.ListenAndServe()
	}()

	shutdown := func() error {
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()

		return server.Shutdown(shutdownCtx)
	}

	s.logger.Info("server started", "http.addr", s.addr)
	select {
	case err := <-startErrC:
		s.logger.Error(err, "server failed to start")
		return err
	case <-ctx.Done():
		s.logger.V(8).Info("server is shutting down")
		return shutdown()
	}
}
