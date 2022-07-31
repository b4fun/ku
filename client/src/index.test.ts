import { toSQL } from './index';

describe('toSQL', () => {
  [
    [
      'source',
      'select * from `{{source}}`',
    ],
    [
      'source | project name',
      'select `name` from `{{source}}`',
    ],
    [
      'source |   project name ',
      'select `name` from `{{source}}`',
    ],
    [
      'source | project x, y',
      'select `x`, `y` from `{{source}}`',
    ],
    [
      'source | project x, y | order by x',
      'select `x`, `y` from `{{source}}` order by x',
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
      'select `y`, `x` from `{{source}}` where x > 2 and y < 3 order by x asc, y desc',
    ],
  ].forEach((testCase, idx) => {
    const [kql, expectedSQL] = testCase;

    test(`toSQL#${idx}`, () => {
      expect(toSQL(kql)).toBe(expectedSQL);
    });
  })
});