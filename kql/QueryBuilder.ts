import { Knex } from 'knex';
import * as Sqlite3Knex from 'knex/lib/dialects/sqlite3';

export function getQueryBuilder(): Knex.QueryBuilder {
  const client = new Sqlite3Knex({
    client: 'sqlite3',
    // for insertion, we don't care this
    useNullAsDefault: false,
    // disable quoting
    wrapIdentifier: (value: string, origImpl: (value: string) => string) => {
      return value;
    },
  });
  return client.queryBuilder();
}

export interface SQLResult {
  readonly sql: string;
}

export type QueryInterface = Knex.QueryBuilder;