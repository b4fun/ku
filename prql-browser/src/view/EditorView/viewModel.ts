import { Session, TableSchema, TableValueEncoder } from "@b4fun/ku-protos";
import { ResultTableViewModel } from "@b4fun/ku-ui";
import { useState } from "react";
import { useSessions } from "../../atom/sessionAtom";
import { grpcClient } from "../../client/api";
import { compileToSQL } from "../../client/prql";

export interface ViewModel {
  widths: [number, number];
  loading: boolean;
  loadError?: Error;
}

export interface ViewModelAction {
  viewModel: ViewModel;

  bootstrap: () => Promise<void>;

  setWidths: (widths: [number, number]) => void;
}

export function useViewModelAction(): ViewModelAction {
  const [viewModel, setViewModel] = useState<ViewModel>({
    widths: [0, 0],
    loading: false,
  });
  const [, setSesssions] = useSessions();

  const setWidths = (widths: [number, number]) => {
    setViewModel((prev) => ({ ...prev, widths }));
  };

  const setLoading = (loading: boolean) => {
    setViewModel((prev) => ({ ...prev, loading }));
  };

  const setLoadErr = (loadError: Error) => {
    setViewModel((prev) => ({
      ...prev,
      loading: false,
      sessions: [],
      loadError,
    }));
  };

  const bootstrap = async () => {
    setLoading(true);
    try {
      const resp = await grpcClient().listSessions({});
      const sessions = resp.response.sessions;
      setSesssions(sessions);
    } catch (err) {
      console.error(`bootstrap failed: ${err}`);
      setLoadErr(err as any);
      return;
    } finally {
      setLoading(false);
    }
  };

  return {
    viewModel,

    bootstrap,
    setWidths,
  };
}

export interface RunQueryViewModel {
  requesting: boolean;
  lastResponseSucceeded: boolean;
  resultViewModel: ResultTableViewModel;
}

export interface RunQueryOptions {
  tables: TableSchema[];
  session: Session;
}

export function compilePRQL(query: string, opts: RunQueryOptions): string {
  console.log("query:", query);
  const sql = compileToSQL(query, {
    names: opts.tables.reduce((acc, table) => ({
      ...acc,
      [table.name]: table.id,
    }), {}),
  });
  console.log("sql:", sql);

  return sql;
}

export interface RunQueryViewModelAction {
  viewModel: RunQueryViewModel;

  runQuery: (query: string, opts: RunQueryOptions) => Promise<void>;
}

export function useRunQueryAction(): RunQueryViewModelAction {
  const [viewModel, setViewModel] = useState<RunQueryViewModel>({
    requesting: false,
    lastResponseSucceeded: false,
    resultViewModel: {
      columns: [],
      data: [],
    },
  });

  const setRequesting = (requesting: boolean) => {
    setViewModel((prev) => ({
      ...prev,
      requesting,
      lastResponseSucceeded: requesting ? false : prev.lastResponseSucceeded,
    }));
  };

  const setResultViewModel = (resultViewModel: ResultTableViewModel) => {
    setViewModel((prev) => ({
      ...prev,
      lastResponseSucceeded: true,
      resultViewModel,
    }));
  };

  const runQuery = async (query: string, opts: RunQueryOptions) => {
    setRequesting(true);

    try {
      const sql = compilePRQL(query, opts);
      const resp = await grpcClient().queryTable({ sql });
      const result: ResultTableViewModel = {
        columns: [],
        data: [],
      };

      result.columns = resp.response.columns.map((columnSchema) => ({
        title: columnSchema.key,
        dataIndex: columnSchema.key,
        key: columnSchema.key,
      }));
      const tableValueEncoder = new TableValueEncoder(resp.response.columns);

      console.log("rows", resp.response.rows);
      console.log("columns", resp.response.columns);
      result.data = resp.response.rows.map((row, idx) => {
        const rowData = tableValueEncoder.encodeRow(row);
        rowData.key = `${idx}`;

        return rowData;
      });

      setResultViewModel(result);
    } finally {
      setRequesting(false);
    }
  };

  return {
    viewModel,
    runQuery,
  };
}
