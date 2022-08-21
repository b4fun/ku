import { TableColumn_Type } from "./model";

export type Nullable<T> = T | null;

// TODO: support time span type
export type TableColumnJavascriptType = boolean | number | string | Date;

function parseIntArrayAsJSONScalar(
  value: Uint8Array,
): Nullable<TableColumnJavascriptType> {
  const valueString = new TextDecoder("utf-8").decode(value);
  return JSON.parse(valueString);
}

export function ParseTableColumnValue<T extends Nullable<TableColumnJavascriptType>>(
  value: Uint8Array,
  type: TableColumn_Type,
): T {
  switch (type) {
    case TableColumn_Type.BOOL:
      const v = parseIntArrayAsJSONScalar(value);
      return parseIntArrayAsJSONScalar(value) as Nullable<boolean> as T;
    case TableColumn_Type.INT64:
    case TableColumn_Type.REAL:
      return parseIntArrayAsJSONScalar(value) as Nullable<number> as T;
    case TableColumn_Type.STRING:
      return parseIntArrayAsJSONScalar(value) as Nullable<string> as T;
    default:
      throw new Error(`Unsupported value type: ${type}`);
  }
}