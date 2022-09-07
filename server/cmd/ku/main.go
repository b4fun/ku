package main

import (
	"context"
	"os"

	"github.com/b4fun/ku/server/internal/applog"
	"github.com/b4fun/ku/server/internal/db"
	"github.com/b4fun/ku/server/internal/exec"
	"github.com/b4fun/ku/server/internal/svc"
	"github.com/spf13/cobra"
)

func main() {
	cmd := createCmd()
	if cmd.Execute() != nil {
		os.Exit(1)
	}
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

			queryService, err := dbProvider.GetQueryService()
			if err != nil {
				return err
			}

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
