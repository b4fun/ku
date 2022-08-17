import axios from "axios";
import { SQLResult } from '@b4fun/kql';
import { APIServiceClient } from '@b4fun/ku-protos';
import { GrpcWebFetchTransport } from "@protobuf-ts/grpcweb-transport";

const apiClient = axios.create({
  baseURL: "http://localhost:4000/",
});

interface TableRow {
  readonly values: { [k: string]: any };
}

export interface QueryRequest {
  readonly query: SQLResult;
}

export interface QueryResponse {
  readonly rows: TableRow[];
}

export async function query(payload: SQLResult): Promise<QueryResponse> {
  const resp = await apiClient.post<QueryResponse>("/query", { query: payload });
  return resp.data;
}

interface APISettings {
  grpcBaseURL: string;
}

var globalAPISettings: APISettings = {
  grpcBaseURL: 'http://localhost:4000/',
};

const paramsKeyGRPCBaseURL = '_grpcBaseURL';

/**
 * setup setups the global api settings.
 */
export function setup() {
  let resolvedAPISettings: Partial<APISettings> = {};

  if (window) {
    const params = new URLSearchParams(window.location.search);

    const v = params.get(paramsKeyGRPCBaseURL);
    if (v) {
      resolvedAPISettings.grpcBaseURL = v;
      console.log(`resolved grpcBaseURL: ${v}`);
    }
  }

  globalAPISettings = {
    ...globalAPISettings,
    ...resolvedAPISettings,
  };
}

export function grpcClient(apiSettings?: APISettings): APIServiceClient {
  apiSettings = apiSettings || globalAPISettings;

  const grpcTransport = new GrpcWebFetchTransport({
    baseUrl: apiSettings.grpcBaseURL,
  })

  return new APIServiceClient(grpcTransport);
}
