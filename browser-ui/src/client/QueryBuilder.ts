export interface SQLResult {
  sql: string;
}

export default interface QueryInterface {
  from(table: string): this;
  select(...columns: string[]): this;
  andWhereRaw(raw: string): this;
  orderByRaw(raw: string): this;
  toSQL(): SQLResult;
}

export class QueryBuilder implements QueryInterface {

  from(table: string): this {
    return this;
  }

  select(...columns: string[]): this {
    return this;
  }

  andWhereRaw(raw: string): this {
    return this;
  }

  orderByRaw(raw: string): this {
    return this;
  }

  toSQL(): SQLResult {
    return {
      sql: '',
    };
  }

}