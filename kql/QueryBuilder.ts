import { Knex } from 'knex';
import * as Sqlite3Knex from 'knex/lib/dialects/sqlite3';

export function getQueryBuilder(): Knex.QueryBuilder {
  const client = new Sqlite3Knex({});
  return client.queryBuilder();
}

export interface SQLResult {
  readonly table: string;
  readonly columns: string[];
  readonly whereClauses: string[];
  readonly orderByClauses: string[];
  readonly sql?: string;
}

export default interface QueryInterface {
  from(table: string): this;
  select(...columns: string[]): this;
  andWhereRaw(raw: string): this;
  orderByRaw(raw: string): this;
  toSQL(): SQLResult;

  qb: Knex.QueryBuilder;
  qbWith(): Knex.QueryBuilder;
}

export class QueryBuilder implements QueryInterface {

  private _table: string = '{{source}}';
  private _columns: string[] = [];
  private _whereClauses: string[] = [];
  private _orderByClauses: string[] = [];
  private _qb: Knex.QueryBuilder = getQueryBuilder();

  from(table: string): this {
    this._table = table;

    return this;
  }

  select(...columns: string[]): this {
    const existingColumns = new Set(this._columns);
    const newColumnsToAdd = [...columns].filter(c => !existingColumns.has(c));
    this._columns.push(...newColumnsToAdd);

    return this;
  }

  andWhereRaw(raw: string): this {
    this._whereClauses.push(raw);

    return this;
  }

  orderByRaw(raw: string): this {
    this._qb = this._qb.orderByRaw(raw);

    this._orderByClauses.push(raw);

    return this;
  }

  toSQL(): SQLResult {
    return {
      table: this._table,
      columns: this._columns,
      whereClauses: this._whereClauses,
      orderByClauses: this._orderByClauses,
      sql: this._qb.toString(),
    };
  }

  get qb(): Knex.QueryBuilder {
    return this._qb;
  }

  qbWith(): Knex.QueryBuilder {
    const qb = getQueryBuilder();

    const previousQB = this._qb;
    qb.with('q1', previousQB).from('q1');

    this._qb = qb;

    return qb;
  }

}