package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/b4fun/ku/server/internal/applog"
	"github.com/b4fun/ku/server/internal/base"
	"github.com/b4fun/ku/server/internal/db"
	"github.com/b4fun/ku/server/internal/exec"
	"github.com/b4fun/ku/server/internal/svc"
	"github.com/rs/cors"
	"github.com/spf13/cobra"
)

func main() {
	cmd := createCmd()
	if cmd.Execute() != nil {
		os.Exit(1)
	}
}

func startAPIServer(queryService base.QueryService) {
	mux := http.NewServeMux()

	mux.HandleFunc("/query", func(w http.ResponseWriter, r *http.Request) {
		log.Println("request start")
		defer log.Println("request end")

		if !strings.EqualFold(r.Method, "POST") {
			w.WriteHeader(400)
			return
		}
		if r.Body == nil {
			w.WriteHeader(400)
			return
		}

		defer r.Body.Close()

		incomingQuery := new(base.QueryRequest)
		if err := json.NewDecoder(r.Body).Decode(incomingQuery); err != nil {
			log.Printf("failed to decode query request: %v", err)
			w.WriteHeader(500)
			return
		}

		queryResp, err := queryService.Query(r.Context(), incomingQuery)
		if err != nil {
			log.Printf("failed to query: %v", err)
			w.WriteHeader(500)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(200)

		enc := json.NewEncoder(w)
		enc.SetIndent("", "  ")
		if err := enc.Encode(queryResp); err != nil {
			log.Printf("failed to response: %v", err)
			w.WriteHeader(500)
			return
		}
	})

	handler := cors.AllowAll().Handler(mux)
	_ = http.ListenAndServe(":8080", handler)
}

func createCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:                "ku",
		Short:              "ku is a tool for collecting and querying logs from local",
		Args:               cobra.MinimumNArgs(1),
		DisableFlagParsing: true,
		RunE: func(cmd *cobra.Command, args []string) error {
			ctx, cancel := context.WithCancel(context.Background())
			defer cancel()

			dbProvider, err := db.NewSqliteProvider("./db.sqlite")
			if err != nil {
				applog.Setup.Error(err, "create db")
				return err
			}

			if err := applog.InstallDBLogger(ctx, dbProvider); err != nil {
				applog.Setup.Error(err, "install db logger")
				return err
			}

			logger, err := applog.NewLogger("ku_cli")
			if err != nil {
				applog.Setup.Error(err, "new db logger")
				return err
			}

			queryService, err := dbProvider.CreateQueryService()
			if err != nil {
				return err
			}
			go startAPIServer(queryService)

			svcOpts := &svc.Options{
				Logger:       logger,
				DBProvider:   dbProvider,
				QueryService: queryService,
			}
			apiServer, err := svc.New(svcOpts)
			if err != nil {
				return err
			}
			go apiServer.Start(ctx)

			childCmd, err := exec.Command(&exec.Opts{
				Logger:          logger,
				Command:         args[0],
				Args:            args[1:],
				Stdout:          cmd.OutOrStdout(),
				Stderr:          cmd.ErrOrStderr(),
				SessionProvider: dbProvider,
			})
			if err != nil {
				return err
			}
			go childCmd.Start(ctx)

			<-ctx.Done()

			return nil
		},
	}

	return cmd
}
