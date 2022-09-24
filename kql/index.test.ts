import { toSQL } from './index';

describe('toSQL', () => {
  [
    [
      'source',
      'select * from source',
    ],
    [
      'source | project name',
      'with q0 as (select name from source) select * from q0',
    ],
    [
      'source |   project name ',
      'with q0 as (select name from source) select * from q0',
    ],
    [
      'source | project x, y',
      'with q0 as (select x, y from source) select * from q0',
    ],
    [
      'source | project x, y | order by x',
      'with q0 as (select x, y from source) select * from q0 order by x',
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
      'with q0 as (select y, x from source where x > 2 and y < 3 order by x asc, y desc) select * from q0',
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
      `with q1 as (with q0 as (select cast(json_extract(ku_parse(lines, '^.*?foo=(?P<foo>\\d+) , bar=(?P<bar>.*?)$'), '$.foo') as integer) as foo, cast(json_extract(ku_parse(lines, '^.*?foo=(?P<foo>\\d+) , bar=(?P<bar>.*?)$'), '$.bar') as text) as bar, * from source where lines like '%foo%') select foo, bar from q0) select * from q1 limit 100`,
    ],
    [
      `
      source
      | project a + 10, b + 10, c = a + b * 2
      `,
      `with q0 as (select a + 10 as p0, b + 10 as p1, a + b * 2 as c from source) select * from q0`,
    ],
    [
      `
      source
      | count
      `,
      `with q0 as (select count(*) as Count from source) select * from q0`,
    ],
    [
      `
      source
      | count as x
      `,
      `with q0 as (select count(*) as x from source) select * from q0`,
    ],
    [
      `
      source
      | where x == 'foo'
      `,
      `select * from source where x == 'foo'`,
    ],
    [
      `
      source
      | project x, y, z
      | project y, x, z
      `,
      `with q1 as (with q0 as (select x, y, z from source) select y, x, z from q0) select * from q1`,
    ],
    [
      `
      source
      | distinct x
      `,
      `with q0 as (select distinct x from source) select * from q0`,
    ],
    [
      `
      source
      | distinct x, y
      `,
      `with q0 as (select distinct x, y from source) select * from q0`,
    ],
    [
      `
      source
      | project x = y contains 'foobar'
      `,
      `with q0 as (select y like '%foobar%' as x from source) select * from q0`,
    ],
    [
      `
      source
      | extend x = y contains 'foobar'
      | project x
      `,
      `with q1 as (with q0 as (select y like '%foobar%' as x, * from source) select x from q0) select * from q1`,
    ],
    [
      `
      source
      | extend x = 1 + y
      | project x, y
      `,
      `with q1 as (with q0 as (select 1 + y as x, * from source) select x, y from q0) select * from q1`,
    ],
  ].forEach((testCase, idx) => {
    const [kql, expectedSQL] = testCase;

    test(`toSQL#${idx}`, () => {
      expect(toSQL(kql).sql).toEqual(expectedSQL);
    });
  })
});