import { Duration } from '../../google/protobuf/duration';
import { Timestamp } from '../../google/protobuf/timestamp';
import { BoolValue, DoubleValue, Int64Value, StringValue } from "../../google/protobuf/wrappers";
import {
  TableColumn, TableColumn_Type, TableKeyValue, TableRow
} from "./model";

type PossibleValueType = BoolValue | StringValue | Int64Value | DoubleValue | Timestamp | Duration;

export type StringRecords = {
  [key: string]: string;
}

export class TableValueEncoder {

  private columnSchemasByKey: Map<string, TableColumn> = new Map();

  constructor(columnSchemas: TableColumn[]) {
    columnSchemas.forEach(col => {
      this.columnSchemasByKey.set(col.key, col);
    });
  }

  private computeIfNotNull<T extends PossibleValueType>(v: T | null, f: (v: T) => string) {
    if (v === null || v === undefined) {
      return;
    }

    f(v);
  }

  private encodeTimestamp(ts: Timestamp): string {
    return Timestamp.toDate(ts).toISOString();
  }

  private encodeDuration(dur: Duration): string {
    // TODO: humanize value
    return `${dur.seconds}s`;
  }

  public encodeKeyValue(kv: TableKeyValue): StringRecords {
    if (!this.columnSchemasByKey.has(kv.key)) {
      throw new Error(`unknown column key ${kv.key}`);
    }

    const rv = { [kv.key]: '' };

    const colType = this.columnSchemasByKey.get(kv.key)!.type;
    switch (colType) {
      case TableColumn_Type.BOOL:
        this.computeIfNotNull(kv.valueBool, v => rv[kv.key] = v.value ? 'true' : 'false');
        return rv;
      case TableColumn_Type.DATE_TIME:
        this.computeIfNotNull(kv.valueDateTime, v => rv[kv.key] = this.encodeTimestamp(v));
        return rv;
      case TableColumn_Type.INT64:
        this.computeIfNotNull(kv.valueInt64, v => rv[kv.key] = `${v.value}`);
        return rv;
      case TableColumn_Type.REAL:
        this.computeIfNotNull(kv.valueReal, v => rv[kv.key] = `${v.value}`);
        return rv;
      case TableColumn_Type.STRING:
        this.computeIfNotNull(kv.valueString, v => rv[kv.key] = `${v.value}`);
        return rv;
      case TableColumn_Type.TIMESPAN:
        this.computeIfNotNull(kv.valueDuration, v => rv[kv.key] = this.encodeDuration(v));
        return rv;
      case TableColumn_Type.UNSPECIFIED:
        // present as empty string
        rv[rv.key] = '';
        return rv;
      default:
        throw new Error(`unsupported column type: ${TableColumn_Type[colType]} (${colType})`);
    }
  }

  public encodeRow(row: TableRow): StringRecords {
    return row.columns.reduce((acc, kv) => ({
      ...acc,
      ...this.encodeKeyValue(kv),
    }), {})
  }

}