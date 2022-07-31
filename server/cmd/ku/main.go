package main

import (
	"context"
	"fmt"
	"io"
	"os"
	"os/exec"
	"sync"

	"github.com/spf13/cobra"
)

func main() {
	cmd := createCmd()
	if cmd.Execute() != nil {
		os.Exit(1)
	}
}

type logBuf struct {
}

func newLogBuf() *logBuf {
	return &logBuf{}
}

func (logBuf) Write(data []byte) (int, error) {
	fmt.Println("[write] ", string(data))
	fmt.Printf("[write] %d\n", int(data[len(data)-1]))

	return len(data), nil
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

			stdoutLogBuf := newLogBuf()
			stderrLogBuf := newLogBuf()

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
