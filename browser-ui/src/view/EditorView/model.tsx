import { Session, TableSchema } from "@b4fun/ku-protos";

export interface ViewModel {
  sessions: Session[];

  isLoading: boolean;
  selectedTable?: TableSchema;
  loadError?: Error;
}

export default function createViewModel(): ViewModel {
  return {
    sessions: [],
    isLoading: true,
  };
}