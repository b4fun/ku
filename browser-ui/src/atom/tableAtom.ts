import { Session, TableSchema } from "@b4fun/ku-protos";
import { atom, useAtom } from "jotai";

export interface TableState {
  session?: Session;
  table?: TableSchema;
  selected: boolean;
}

export interface SelectedTableState {
  session: Session;
  table: TableSchema;
}

export const tableAtom = atom<TableState>({
  selected: false,
});

export function useSelectTable(): (session: Session, table: TableSchema) => void {
  const [, setTable] = useAtom(tableAtom);

  return (session, table) => {
    setTable({
      session,
      table,
      selected: true,
    });
  };
}

export function useSelectedTable(): [SelectedTableState, true] | [null, false] {
  const [tableValue,] = useAtom(tableAtom);
  if (tableValue.selected) {
    return [
      { session: tableValue.session!, table: tableValue.table! },
      true,
    ];
  }

  return [null, false];
}

export function isSelectedTable(
  state: SelectedTableState,
  table: TableSchema,
): boolean {
  return state.session.id === table.sessionId && state.table.name === table.name;
}