import { Session, TableColumn_Type, TableSchema } from "@b4fun/ku-protos";

export interface KustoDatabaseSchema {
  readonly Name: string;
  readonly Tables: { [k: string]: KustoTableSchema };
  readonly Functions: { [k: string]: unknown };
}

export interface KustoTableSchema {
  readonly Name: string;
  readonly OrderedColumns: {
    readonly Name: string;
    readonly CslType: CslTypes;
  }[];
}

// ref https://docs.microsoft.com/en-us/azure/data-explorer/kusto/query/scalar-data-types/ 
type CslTypes = 'bool' | 'datetime' | 'dynamic' | 'guid' | 'int' | 'long' | 'real' | 'string' | 'timespan' | 'decimal';

function columnTypeToCslTypes(ct: TableColumn_Type): CslTypes {
  switch (ct) {
    case TableColumn_Type.BOOL:
      return 'bool';
    case TableColumn_Type.DATE_TIME:
      return 'datetime';
    case TableColumn_Type.INT64:
      return 'long';
    case TableColumn_Type.REAL:
      return 'real';
    case TableColumn_Type.STRING:
      return 'string';
    case TableColumn_Type.TIMESPAN:
      return 'timespan';
    default:
      return 'dynamic';
  }
};

export function tableSchemaToKustoSchema(table: TableSchema): KustoTableSchema {
  return {
    Name: table.name,
    OrderedColumns: table.columns.map(column => ({
      Name: column.key,
      CslType: columnTypeToCslTypes(column.type),
    })),
  };
}

export function sessionToKustoSchema(session: Session): KustoDatabaseSchema {
  return {
    Name: session.name,
    Tables: session.tables.reduce((acc, table) => {
      const kustoTableSchema = tableSchemaToKustoSchema(table);

      return {
        ...acc,
        [kustoTableSchema.Name]: kustoTableSchema,
      };
    }, {}),
    Functions: {}
  };
}