import { Session } from "@b4fun/ku-protos";

export interface ViewModel {
  sessions: Session[];

  isLoading: boolean;
  loadError?: Error;
}

export default function createViewModel(): ViewModel {
  return {
    sessions: [],
    isLoading: true,
  };
}