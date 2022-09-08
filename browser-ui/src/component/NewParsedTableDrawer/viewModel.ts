import { Session } from "@b4fun/ku-protos";
import { useState } from "react";

export interface ViewModelData {
  session: Session;
  sql: string;
  queryInput: string;
}

export interface ViewModel {
  data?: ViewModelData;

  show: boolean;
  submitting: boolean;
}

export interface ViewModelWithData extends ViewModel {
  data: ViewModelData;
}

export interface ViewModelAction<T extends ViewModel = ViewModel> {
  viewModel: T;

  startSubmit: () => void;
  finishSubmit: () => void;
  showDrawer: (data: ViewModelData) => void;
  hideDrawer: () => void;
}

export function useViewModelAction(): ViewModelAction {
  const [viewModel, setViewModel] = useState<ViewModel>({
    show: false,
    submitting: false,
  });

  const startSubmit = () => {
    setViewModel(prev => ({ ...prev, submitting: true }));
  };

  const finishSubmit = () => {
    setViewModel(prev => ({ ...prev, submitting: false }));
  };

  const showDrawer = (data: ViewModelData) => {
    setViewModel(prev => ({ ...prev, show: true, submitting: false, data }));
  };

  const hideDrawer = () => {
    setViewModel(prev => ({ ...prev, show: false, data: undefined }));
  };

  return {
    viewModel,
    startSubmit,
    finishSubmit,
    showDrawer,
    hideDrawer,
  };
}