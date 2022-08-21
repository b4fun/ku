import { TableColumn_Type } from './model';
import { ParseTableColumnValue } from './data_value';

function encodeToUint8Array(value: any): Uint8Array {
  const encoded = JSON.stringify(value);
  return new TextEncoder().encode(encoded);
}

describe('ParseTableColumnValue', () => {
  [
    [encodeToUint8Array(true), TableColumn_Type.BOOL, true],
    [encodeToUint8Array(false), TableColumn_Type.BOOL, false],
    [encodeToUint8Array(1), TableColumn_Type.INT64, 1],
    [encodeToUint8Array(100_000), TableColumn_Type.INT64, 100_000],
    [encodeToUint8Array(42.00001), TableColumn_Type.REAL, 42.00001],
    [encodeToUint8Array(0.00001), TableColumn_Type.REAL, 0.00001],
    [encodeToUint8Array('foobar'), TableColumn_Type.STRING, 'foobar'],
  ].forEach((testCase, idx) => {
    test(`ParseTableColumnValue#${idx}`, () => {
      expect(ParseTableColumnValue(testCase[0] as Uint8Array, testCase[1] as TableColumn_Type)).
        toEqual(testCase[2]);
    });
  });

  test('nullable value', () => {
    Object.keys(TableColumn_Type).forEach(columnType => {
      // FIXME: I don't where does this mixed TableColumn_Type and string value come from...
      if (typeof columnType === 'string') {
        return;
      }

      if (columnType === TableColumn_Type.UNSPECIFIED) {
        // unsupported
        return;
      }
      if (columnType === TableColumn_Type.DATE_TIME || columnType === TableColumn_Type.TIMESPAN) {
        // TODO: add support
        return;
      }

      expect(ParseTableColumnValue(
        encodeToUint8Array(null),
        columnType,
      )).toBeNull();
    });
  })
});