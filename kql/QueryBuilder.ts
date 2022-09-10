import { Knex } from 'knex';
import * as Sqlite3Knex from 'knex/lib/dialects/sqlite3';

// FIXME: workaround to use in both dev and prod environment
let Sqlite3KnexCtor = Sqlite3Knex;
if (Sqlite3Knex.default) {
  Sqlite3KnexCtor = Sqlite3Knex.default;
}

const _client = new Sqlite3KnexCtor({
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

export interface DebugSQLOptions {
  logUnknown?: (msg: string, ...args: any[]) => void;
}

export class QueryContext {

  private debug: DebugSQLOptions;

  private _cteTableIdx = 0;
  private _projectIdx = 0;

  constructor(debug?: DebugSQLOptions) {
    this.debug = debug ?? {};
  }

  public acquireCTETableName(): string {
    return `q${this._cteTableIdx++}`;
  }

  public acquireAutoProjectAsName(): string {
    return `p${this._projectIdx++}`;
  }

  public logUnknown(msg: string, ...args: any[]) {
    if (this.debug.logUnknown) {
      this.debug.logUnknown(msg, ...args);
    }
  }

}