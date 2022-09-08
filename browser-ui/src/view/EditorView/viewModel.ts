import { useState } from "react";

export interface ViewModel {
  widths: [number, number];
  loading: boolean;
  loadError?: Error;
}

export interface ViewModelAction {
  viewModel: ViewModel;

  setWidths: (widths: [number, number]) => void;

  setLoading: (loading: boolean) => void;
  setLoadErr: (loadError: Error) => void;
}

export function useViewModelAction(): ViewModelAction {
  const [viewModel, setViewModel] = useState<ViewModel>({
    widths: [0, 0],
    loading: false,
  });

  const setWidths = (widths: [number, number]) => {
    setViewModel(prev => ({ ...prev, widths }));
  }

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

    setWidths,

    setLoading,
    setLoadErr,
  };
}