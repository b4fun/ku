import { Session, TableSchema } from "@b4fun/ku-protos";
import { atom, useAtom } from "jotai";

// TableKey defines the key of a table.
// The first value is the session id, the second value is the table name.
export type TableKey = [string, string];

interface SessionMapState {
  sessionIDs: string[];
  sessionsByID: { [k: string]: Session };
}

export interface SessionsState extends SessionMapState {
  // key: sessionId, name
  selectedTableKey?: TableKey;
}

const sessionsAtom = atom<SessionsState>({
  sessionIDs: [],
  sessionsByID: {},
});

export const sessionsListAtom = atom(
  (get) => {
    const state = get(sessionsAtom);

    return state.sessionIDs.map((id) => state.sessionsByID[id]).filter(Boolean);
  },
  (get, set, newSessions: Session[]) => {
    const prev = get(sessionsAtom);

    const newSessionState = {
      sessionIDs: newSessions.map((s) => s.id),
      sessionsByID: newSessions.reduce((acc, s) => ({ ...acc, [s.id]: s }), {}),
    };

    let { selectedTableKey } = prev;
    if (!findTableByKey(newSessionState, selectedTableKey)) {
      // update previous selected table if needed
      if (newSessions.length > 0) {
        selectedTableKey = [newSessions[0].id, newSessions[0].tables[0].name];
      } else {
        selectedTableKey = undefined;
      }
    }

    set(sessionsAtom, {
      ...prev,
      ...newSessionState,
      selectedTableKey,
    });
  }
);

function findTableByKey(
  state: SessionMapState,
  key: TableKey | undefined,
): [Session, TableSchema] | undefined {
  if (!key) {
    return;
  }

  const [sessionId, tableName] = key;

  const session = state.sessionsByID[sessionId];
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

    return findTableByKey(state, state.selectedTableKey);
  },
  (get, set, table: TableSchema) => {
    const state = get(sessionsAtom);

    const selectedKey: TableKey = [table.sessionId, table.name];
    if (!findTableByKey(state, selectedKey)) {
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
  const selected = findTableByKey(state, state.selectedTableKey);
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

export function useUpdateSession(): (session: Session) => void {
  const [, setState] = useAtom(sessionsAtom);

  return (session) => {
    setState(prev => {
      const sessionIDs = [...prev.sessionIDs];
      if (sessionIDs.findIndex(id => id === session.id) === -1) {
        // new session, append to the end
        sessionIDs.push(session.id);
      }

      return {
        ...prev,
        sessionIDs,
        sessionsByID: {
          ...prev.sessionsByID,
          [session.id]: session,
        },
      };
    });
  };
}