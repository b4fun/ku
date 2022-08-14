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

const grpcTransport = new GrpcWebFetchTransport({
  baseUrl: 'http://localhost:4000/',
})

export const grpcClient = new APIServiceClient(grpcTransport);