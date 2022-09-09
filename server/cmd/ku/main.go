package main

import (
	"context"
	"fmt"
	"os"

	"github.com/alecthomas/kong"
	"github.com/b4fun/ku/server/internal/applog"
	"github.com/b4fun/ku/server/internal/db"
	"github.com/b4fun/ku/server/internal/exec"
	"github.com/b4fun/ku/server/internal/svc"
)

type CLI struct {
	Ku struct {
		DBPath     string `required:"" help:"path to the logs db" default:"./db.sqlite" type:"path"`
		ServerAddr string `required:"" help:"server listen address" default:"127.0.0.1:4000"`
	} `embed:"" prefix:"ku-"`

	Cmd struct {
		CommandAndFlags []string `arg:"" passthrough:""`
	} `embed:""`
}

func (c *CLI) Run() error {
	if len(c.Cmd.CommandAndFlags) < 1 {
		return fmt.Errorf("no command specified")
	}

	childCmdName, childArgs := c.Cmd.CommandAndFlags[0], c.Cmd.CommandAndFlags[1:]

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	dbProvider, err := db.NewSqliteProvider(c.Ku.DBPath)
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
	sessionRepo, err := dbProvider.GetSessionRepository()
	if err != nil {
		return err
	}

	svcOpts := &svc.Options{
		Logger:       logger,
		DBProvider:   dbProvider,
		QueryService: queryService,
		SessionRepo:  sessionRepo,
	}
	apiServer, err := svc.New(svcOpts)
	if err != nil {
		return err
	}
	go apiServer.Start(ctx)

	childCmd, err := exec.Command(&exec.Opts{
		Logger:          logger,
		Command:         childCmdName,
		Args:            childArgs,
		Stdout:          os.Stdout,
		Stderr:          os.Stderr,
		SessionProvider: dbProvider,
	})
	if err != nil {
		return err
	}
	go childCmd.Start(ctx)

	<-ctx.Done()

	return nil
}

func main() {
	cliCtx := kong.Parse(
		&CLI{},
		kong.Name("ku"),
		kong.Description("A tool for collecting and querying logs from command line program."),
	)
	cliCtx.FatalIfErrorf(cliCtx.Run())
}
