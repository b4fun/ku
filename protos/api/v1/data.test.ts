import { TableColumn_Type, TableSchema, TableSchema_Type, TableKeyValue } from "./model";
import { TableValueEncoder } from "./data";
import { Timestamp } from "../../google/protobuf/timestamp";
import { Duration } from "../../google/protobuf/duration";

describe('PossibleValueType', () => {
  const schema: TableSchema = {
    name: 'test',
    sessionId: 'test-session-id',
    type: TableSchema_Type.RAW,
    columns: [
      {
        key: 'bool',
        type: TableColumn_Type.BOOL,
      },
      {
        key: 'datetime',
        type: TableColumn_Type.DATE_TIME,
      },
      {
        key: 'int64',
        type: TableColumn_Type.INT64,
      },
      {
        key: 'real',
        type: TableColumn_Type.REAL,
      },
      {
        key: 'string',
        type: TableColumn_Type.STRING,
      },
      {
        key: 'timespan',
        type: TableColumn_Type.TIMESPAN,
      },
    ],
  };

  describe('encodeKeyValue', () => {
    [
      [
        {
          key: 'bool', valueBool: { value: false },
        },
        { bool: 'false' },
      ],
      [
        {
          key: 'bool', valueBool: { value: true },
        },
        { bool: 'true' },
      ],
      [
        {
          key: 'bool', valueBool: null,
        },
        { bool: '' },
      ],
      [
        {
          key: 'datetime', valueDateTime: Timestamp.fromDate(new Date('2022-08-21T15:23:49.433Z')),
        },
        { 'datetime': '2022-08-21T15:23:49.433Z' },
      ],
      [
        {
          key: 'int64', valueInt64: { value: 42 },
        },
        { 'int64': '42' },
      ],
      [
        {
          key: 'real', valueReal: { value: 42.0001 },
        },
        { 'real': '42.0001' },
      ],
      [
        {
          key: 'timespan', valueDuration: Duration.create(),
        },
        { 'timespan': '0s' },
      ],
    ].forEach((testCase, idx) => {
      it(`encodeKeyValue#${idx}`, () => {
        const enc = new TableValueEncoder(schema);
        const encodedValue = enc.encodeKeyValue(testCase[0] as TableKeyValue);
        expect(encodedValue).toEqual(testCase[1]);
      });
    });

    it('throws error for unknown field', () => {
      const enc = new TableValueEncoder(schema);
      expect(() => {
        enc.encodeKeyValue({ key: 'foobar' });
      }).toThrow(Error);
    })
  });

  describe('encodeRow', () => {
    it('encode row to data', () => {
      const enc = new TableValueEncoder(schema);
      const encodedValue = enc.encodeRow({
        columns: [
          {
            key: 'bool', valueBool: { value: false },
          },
          {
            key: 'string', valueString: { value: 'foo' },
          }
        ],
      });
      expect(encodedValue).toEqual({
        'bool': 'false',
        'string': 'foo',
      })
    });
  });
})