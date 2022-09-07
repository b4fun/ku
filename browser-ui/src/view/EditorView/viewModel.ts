import { useState } from "react";

export interface ViewModel {
  loading: boolean;
  loadError?: Error;
}

export interface ViewModelAction {
  viewModel: ViewModel;

  setLoading: (loading: boolean) => void;
  setLoadErr: (loadError: Error) => void;
}

export function useViewModelAction(): ViewModelAction {
  const [viewModel, setViewModel] = useState<ViewModel>({
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

  return {
    viewModel,
    setLoading,
    setLoadErr,
  };
}