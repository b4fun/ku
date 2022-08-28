import { QueryTableResponse } from '@b4fun/ku-protos';
import { ColumnType, DefaultRecordType } from 'rc-table/lib/interface';
import React, { useState } from 'react';

export interface ResultTableViewModel {
  columns: ColumnType<DefaultRecordType>[];
  data: DefaultRecordType[];
}

export function useResultTableViewModel(): [ResultTableViewModel, React.Dispatch<React.SetStateAction<ResultTableViewModel>>] {
  return useState<ResultTableViewModel>({
    columns: [],
    data: [],
  });
}

export interface RunQueryViewModel {
  requesting: boolean;
  response?: QueryTableResponse;

  // TODO: request object & request error
}

export interface RunQueryViewModelAction {
  viewModel: RunQueryViewModel;

  setRequesting: (requesting: boolean) => void;
  setResponse: (response: QueryTableResponse) => void;
}

export function useRunQueryAction(): RunQueryViewModelAction {
  const [viewModel, setViewModel] = useState<RunQueryViewModel>({ requesting: false });

  const setRequesting = (requesting: boolean) => {
    setViewModel(prev => ({
      ...prev,
      requesting,
    }));
  };

  const setResponse = (response: QueryTableResponse) => {
    setViewModel(prev => ({
      ...prev,
      requesting: false,
      response,
    }));
  };

  return {
    viewModel,
    setRequesting,
    setResponse,
  };
}