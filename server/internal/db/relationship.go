package db

import (
	"context"
	"fmt"

	v1 "github.com/b4fun/ku/protos/api/v1"
	"google.golang.org/protobuf/proto"
)

func associateSessionTables(
	sessions []*v1.Session,
	dbSessionTables []dbSessionTable,
) error {
	tablesBySessionID := map[string][]*v1.TableSchema{}
	for _, dbEntry := range dbSessionTables {
		table := new(v1.TableSchema)
		if err := proto.Unmarshal(dbEntry.TableProtos, table); err != nil {
			err := fmt.Errorf(
				"decode table protos for table %s/%s: %w",
				dbEntry.SessionID, dbEntry.TableID, err,
			)
			return err
		}
		table.Id = dbEntry.TableID
		table.SessionId = dbEntry.SessionID
		tablesBySessionID[dbEntry.SessionID] = append(
			tablesBySessionID[dbEntry.SessionID],
			table,
		)
	}

	for idx := range sessions {
		session := sessions[idx]
		session.Tables = tablesBySessionID[session.Id]
	}

	return nil
}

func loadSessionTables(
	ctx context.Context,
	loadSessions func(ctx context.Context) ([]*v1.Session, error),
	loadDBSessionTables func(ctx context.Context, sessions []*v1.Session) ([]dbSessionTable, error),
) ([]*v1.Session, error) {
	sessions, err := loadSessions(ctx)
	if err != nil {
		return nil, fmt.Errorf("load sessions: %w", err)
	}

	dbSessionTables, err := loadDBSessionTables(ctx, sessions)
	if err != nil {
		return nil, fmt.Errorf("load session tables: %w", err)
	}

	if err := associateSessionTables(sessions, dbSessionTables); err != nil {
		return nil, fmt.Errorf("associate session tables: %w", err)
	}

	return sessions, nil
}

func loadSessionTableForSession(
	ctx context.Context,
	loadSession func(ctx context.Context) (*v1.Session, error),
	loadDBSessionTables func(ctx context.Context, sessions []*v1.Session) ([]dbSessionTable, error),
) (*v1.Session, error) {
	sessions, err := loadSessionTables(
		ctx,
		func(ctx context.Context) ([]*v1.Session, error) {
			session, err := loadSession(ctx)
			if err != nil {
				return nil, err
			}

			return []*v1.Session{session}, nil
		},
		loadDBSessionTables,
	)
	if err != nil {
		return nil, err
	}

	return sessions[0], nil
}
