import { toSQL } from './index';

describe('toSQL', () => {
  [
    [
      'source',
      'select * from source',
    ],
    [
      'source | project name',
      'select name from source',
    ],
    [
      'source |   project name ',
      'select name from source',
    ],
    [
      'source | project x, y',
      'select x, y from source',
    ],
    [
      'source | project x, y | order by x',
      'select x, y from source order by x',
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
      'select y, x from source where x > 2 and y < 3 order by x asc, y desc',
    ],
    [
      `
      source
      | where x contains 'foo'
      | where y !contains 'bar'
      `,
      `select * from source where x like '%foo%' and y not like '%bar%'`,
    ],
    [
      `
      source
      | where y > ago(5h)
      `,
      // TODO(hbc): for duration literals, we might need to quote it as string
      //            before passing to the server: ago(5h) -> ago('5h')
      `select * from source where y > ago(5h)`,
    ],
    [
      `
      source
      | take 10
      `,
      `select * from source limit 10`,
    ],
    [
      `
      source
      | where lines contains 'foo'
      | parse lines with * 'foo=' foo:long ' , bar=' bar
      | project foo, bar
      | take 100
      `,
      `with q0 as (select *, cast(json_extract(ku_parse(lines, '.*foo=(?P<foo>\\d+) , bar=(?P<bar>.*)'), '$.foo') as integer) as foo, cast(json_extract(ku_parse(lines, '.*foo=(?P<foo>\\d+) , bar=(?P<bar>.*)'), '$.bar') as text) as bar from source where lines like '%foo%') select foo, bar from q0 limit 100`,
    ],
  ].forEach((testCase, idx) => {
    const [kql, expectedSQL] = testCase;

    test(`toSQL#${idx}`, () => {
      expect(toSQL(kql).sql).toEqual(expectedSQL);
    });
  })
});