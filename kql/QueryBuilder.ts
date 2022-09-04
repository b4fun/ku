import { Knex } from 'knex';
import * as Sqlite3Knex from 'knex/lib/dialects/sqlite3';

const _client = new Sqlite3Knex({
  client: 'sqlite3',
  // for insertion, we don't care this
  useNullAsDefault: false,
  // disable quoting
  wrapIdentifier: (value: string, origImpl: (value: string) => string) => {
    return value;
  },
});

export function getQueryBuilder(): Knex.QueryBuilder {
  return _client.queryBuilder();
}

export const raw = _client.raw;

export interface SQLResult {
  readonly sql: string;
}

export type QueryInterface = Knex.QueryBuilder;

export class QueryContext {

  private _cteTableIdx = 0;

  public acquireCTETableName(): string {
    return `q${this._cteTableIdx++}`;
  }

}