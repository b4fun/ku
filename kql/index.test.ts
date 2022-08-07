import { toSQL } from './index';
import { SQLResult } from './QueryBuilder';

function testSQLResult(v?: Partial<SQLResult>): SQLResult {
  const rv: SQLResult = {
    table: 'source',
    columns: [],
    whereClauses: [],
    orderByClauses: [],
  };

  return { ...rv, ...v };
}

describe('toSQL', () => {
  [
    [
      'source',
      testSQLResult(),
    ],
    [
      'source | project name',
      testSQLResult({
        columns: ['name'],
      }),
    ],
    [
      'source |   project name ',
      testSQLResult({
        columns: ['name'],
      }),
    ],
    [
      'source | project x, y',
      testSQLResult({
        columns: ['x', 'y'],
      }),
    ],
    [
      'source | project x, y | order by x',
      testSQLResult({
        columns: ['x', 'y'],
        orderByClauses: ['x'],
      }),
    ],
    [
      `
      source
      | where x > 2
      | where y < 3
      | order by x asc
      | order by y desc
      | project y, x
      `,
      testSQLResult({
        columns: ['y', 'x'],
        orderByClauses: ['x asc', 'y desc'],
        whereClauses: ['x > 2', 'y < 3'],
      }),
    ],
    [
      `
      source
      | where x contains 'foo'
      | where y !contains 'bar'
      `,
      testSQLResult({
        whereClauses: ["x LIKE '%foo%'", "y NOT LIKE '%bar%'"],
      }),
    ],
    [
      `
      source
      | where y > ago(5h)
      `,
      testSQLResult({
        // TODO(hbc): for duration literals, we might need to quote it as string
        //            before passing to the server: ago(5h) -> ago('5h')
        whereClauses: ['y > ago(5h)'],
      }),
    ],
  ].forEach((testCase, idx) => {
    const [kql, expectedSQL] = testCase;

    test(`toSQL#${idx}`, () => {
      expect(toSQL(kql as string)).toEqual(expectedSQL);
    });
  })
});