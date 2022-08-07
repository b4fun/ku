import axios from "axios";
import { SQLResult } from '@b4fun/kql';

const apiClient = axios.create({
  baseURL: "http://localhost:8080/",
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