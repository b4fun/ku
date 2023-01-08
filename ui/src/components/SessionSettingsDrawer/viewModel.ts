import { Session } from '@b4fun/ku-protos';
import { useState } from 'react';

export interface ViewModelData {
  session: Session;
}

export interface ViewModel {
  data?: ViewModelData;

  show: boolean;
  submitting: boolean;
}

export interface ViewModelAction {
  viewModel: ViewModel;

  startSubmit: () => void;
  finishSubmit: () => void;
  showDrawer: (data: ViewModelData) => void;
  hideDrawer: () => void;
}

export function useViewModelAction(data?: ViewModelData): ViewModelAction {
  const [viewModel, setViewModel] = useState<ViewModel>({
    data,
    show: false,
    submitting: false,
  });

  const startSubmit = () => {
    setViewModel((prev) => ({ ...prev, submitting: true }));
  };

  const finishSubmit = () => {
    setViewModel((prev) => ({ ...prev, submitting: false }));
  };

  const showDrawer = (data: ViewModelData) => {
    setViewModel((prev) => ({ ...prev, show: true, submitting: false, data }));
  };

  const hideDrawer = () => {
    setViewModel((prev) => ({ ...prev, show: false, data: undefined }));
  };

  return {
    viewModel,
    startSubmit,
    finishSubmit,
    showDrawer,
    hideDrawer,
  };
}
