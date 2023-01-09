import { ResultTableViewModel } from "@b4fun/ku-ui";
import { useState } from "react";
import { useSessions } from "../../atom/sessionAtom";
import { grpcClient } from "../../client/api";

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
  resultViewModel: ResultTableViewModel;
}

export interface RunQueryViewModelAction {
  viewModel: RunQueryViewModel;

  runQuery: (query: string) => Promise<void>;
}

export function useRunQueryAction(): RunQueryViewModelAction {
  const [resultViewModel, setResultViewModel] = useState<ResultTableViewModel>({
    columns: [],
    data: [],
  });

  const [viewModel, setViewModel] = useState<RunQueryViewModel>({
    requesting: false,
    resultViewModel,
  });

  const setRequesting = (requesting: boolean) => {
    setViewModel((prev) => ({
      ...prev,
      requesting,
    }));
  };

  const runQuery = async (query: string) => {
    setRequesting(true);

    console.log(query);
  };

  return {
    viewModel,
    runQuery,
  };
}
