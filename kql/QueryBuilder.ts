export interface SQLResult {
  readonly table: string;
  readonly columns: string[];
  readonly whereClauses: string[];
  readonly orderByClauses: string[];
}

export default interface QueryInterface {
  from(table: string): this;
  select(...columns: string[]): this;
  andWhereRaw(raw: string): this;
  orderByRaw(raw: string): this;
  toSQL(): SQLResult;
}

export class QueryBuilder implements QueryInterface {

  private _table: string = '{{source}}';
  private _columns: string[] = [];
  private _whereClauses: string[] = [];
  private _orderByClauses: string[] = [];

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
    this._orderByClauses.push(raw);

    return this;
  }

  toSQL(): SQLResult {
    return {
      table: this._table,
      columns: this._columns,
      whereClauses: this._whereClauses,
      orderByClauses: this._orderByClauses,
    };
  }

}