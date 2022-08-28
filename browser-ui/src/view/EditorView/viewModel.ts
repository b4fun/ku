import { Session } from "@b4fun/ku-protos";
import { useState } from "react";

export interface ViewModel {
  sessions: Session[];

  loading: boolean;
  loadError?: Error;
}

export interface ViewModelAction {
  viewModel: ViewModel;

  setLoading: (loading: boolean) => void;
  setLoadErr: (loadError: Error) => void;
  setSessions: (sessions: Session[]) => void;
}

export function useViewModelAction(): ViewModelAction {
  const [viewModel, setViewModel] = useState<ViewModel>({
    sessions: [],
    loading: false,
  });

  const setLoading = (loading: boolean) => {
    setViewModel(prev => ({ ...prev, loading }));
  };

  const setLoadErr = (loadError: Error) => {
    setViewModel(prev => ({
      ...prev,
      loading: false,
      sessions: [],
      loadError,
    }));
  };

  const setSessions = (sessions: Session[]) => {
    setViewModel(prev => ({
      ...prev,
      loading: false,
      sessions,
    }));
  };

  return {
    viewModel,
    setLoading,
    setLoadErr,
    setSessions,
  };
}