import { Session, TableSchema } from "@b4fun/ku-protos";
import { atom, useAtom } from "jotai";

// TableKey defines the key of a table.
// The first value is the session id, the second value is the table name.
export type TableKey = [string, string];

export interface SessionsState {
  sessions: Session[];

  // key: sessionId, name
  selectedTableKey?: TableKey;
}

const sessionsAtom = atom<SessionsState>({
  sessions: [],
});

export const sessionsListAtom = atom(
  (get) => {
    return get(sessionsAtom).sessions;
  },
  (get, set, newSessions: Session[]) => {
    const prev = get(sessionsAtom);

    let { selectedTableKey } = prev;
    if (!findTableByKey(newSessions, selectedTableKey)) {
      // update previous selected table if needed
      if (newSessions.length > 0) {
        selectedTableKey = [newSessions[0].id, newSessions[0].tables[0].name];
      } else {
        selectedTableKey = undefined;
      }
    }

    set(sessionsAtom, {
      ...prev,
      sessions: newSessions,
      selectedTableKey,
    });
  }
);

function findTableByKey(
  sessions: Session[],
  key: TableKey | undefined,
): [Session, TableSchema] | undefined {
  if (!key) {
    return;
  }

  const [sessionId, tableName] = key;

  // TODO: O(n) => O(1)
  const session = sessions.find(s => s.id === sessionId);
  if (!session) {
    return;
  }

  const table = session.tables.find(t => t.name === tableName);
  if (!table) {
    return;
  }

  return [session, table];
}

export const selectedTableAtom = atom(
  (get) => {
    const state = get(sessionsAtom);
    if (!state.selectedTableKey) {
      return;
    }

    return findTableByKey(state.sessions, state.selectedTableKey);
  },
  (get, set, table: TableSchema) => {
    const state = get(sessionsAtom);

    const selectedKey: TableKey = [table.sessionId, table.name];
    if (!findTableByKey(state.sessions, selectedKey)) {
      // unselectable table...
      return;
    }

    set(sessionsAtom, {
      ...state,
      selectedTableKey: selectedKey,
    });
  },
);

export function useSelectTable(): (session: Session, table: TableSchema) => void {
  const [, setTable] = useAtom(selectedTableAtom);

  return (session, table) => {
    setTable(table);
  };
}

export interface SelectedTableState {
  session: Session;
  table: TableSchema;
}

export function useSelectedTable(): [SelectedTableState, true] | [null, false] {
  const [state] = useAtom(sessionsAtom);
  const selected = findTableByKey(state.sessions, state.selectedTableKey);
  if (!selected) {
    return [null, false];
  }

  const [session, table] = selected;
  return [{ session, table }, true];
}

export function isSelectedTable(
  state: SelectedTableState,
  table: TableSchema,
): boolean {
  return state.session.id === table.sessionId && state.table.name === table.name;
}

export const useSessions = () => useAtom(sessionsListAtom);