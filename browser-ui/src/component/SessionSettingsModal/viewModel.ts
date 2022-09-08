import { Session } from "@b4fun/ku-protos";
import { useState } from "react";

export interface ViewModel {
  session?: Session;
  show: boolean;
  submitting: boolean;
}

export interface ViewModelWithSession extends ViewModel {
  session: Session;
}

export interface ViewModelAction<T extends ViewModel = ViewModel> {
  viewModel: T;

  startSubmit: () => void;
  finishSubmit: () => void;
  showModal: (session: Session) => void;
  hideModal: () => void;
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

  const showModal = (session: Session) => {
    setViewModel(prev => ({ ...prev, show: true, submitting: false, session }));
  };

  const hideModal = () => {
    setViewModel(prev => ({ ...prev, show: false, session: undefined }));
  };

  return {
    viewModel,
    startSubmit,
    finishSubmit,
    showModal,
    hideModal,
  };
}