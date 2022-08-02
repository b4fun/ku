package main

import (
	"context"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"strings"
	"sync"
	"time"

	"github.com/b4fun/ku/server/internal/db"
	"github.com/b4fun/ku/server/internal/svc"
	"github.com/spf13/cobra"
)

func main() {
	cmd := createCmd()
	if cmd.Execute() != nil {
		os.Exit(1)
	}
}

type logBuf struct {
	session db.Session
}

func newLogBuf(session db.Session) *logBuf {
	return &logBuf{session: session}
}

func (b *logBuf) Write(data []byte) (int, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
	defer cancel()

	err := b.session.WriteLogLine(
		ctx,
		db.WriteLogLinePayload{
			Timestamp: time.Now(),
			// FIXME: just assuming the data is a full line
			Line: strings.TrimSuffix(string(data), "\n"),
		},
	)
	if err != nil {
		return -1, err
	}

	return len(data), nil
}

func startAPIServer(queryService svc.QueryService) {
	http.HandleFunc("/query", func(w http.ResponseWriter, r *http.Request) {
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

		incomingQuery := new(svc.QueryRequest)
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

	_ = http.ListenAndServe(":8080", nil)
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
				return err
			}

			queryService, err := dbProvider.CreateQueryService()
			if err != nil {
				return err
			}
			go startAPIServer(queryService)

			session, err := dbProvider.CreateSession(ctx)
			if err != nil {
				return err
			}

			stdoutLogBuf := newLogBuf(session)
			stderrLogBuf := newLogBuf(session)

			childCmd := exec.CommandContext(
				ctx,
				args[0],
				args[1:]...,
			)
			stdout, err := childCmd.StdoutPipe()
			if err != nil {
				return err
			}
			stderr, err := childCmd.StderrPipe()
			if err != nil {
				return err
			}
			if err := childCmd.Start(); err != nil {
				return err
			}

			wg := new(sync.WaitGroup)

			wg.Add(1)
			go func() {
				defer wg.Done()

				writer := io.MultiWriter(
					stdoutLogBuf,
					cmd.OutOrStdout(),
				)

				io.Copy(writer, stdout)
			}()
			wg.Add(1)
			go func() {
				defer wg.Done()

				writer := io.MultiWriter(
					stderrLogBuf,
					cmd.ErrOrStderr(),
				)

				io.Copy(writer, stderr)
			}()

			wg.Wait()
			if err := childCmd.Wait(); err != nil {
				return err
			}

			return nil
		},
	}

	return cmd
}
