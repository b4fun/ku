import { TableColumn_Type, TableSchema, TableSchema_Type } from "./model";
import { TableValueEncoder } from "./data";

describe('PossibleValueType', () => {
  const schema: TableSchema = {
    name: 'test',
    sessionId: 'test-session-id',
    type: TableSchema_Type.RAW,
    columns: [
      {
        key: 'test',
        type: TableColumn_Type.BOOL,
      },
    ],
  }

  it('basic', () => {
    const enc = new TableValueEncoder(schema);
    const value = enc.encodeKeyValue({
      key: 'test',
      valueBool: { value: false },
    });
    expect(value).toEqual({ test: 'false' });
  });
})