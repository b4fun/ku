use prql_compiler::ast::pl::fold;
use serde::{Deserialize, Serialize};

use super::source::Source;

#[derive(Clone, Copy, Serialize, Deserialize, Debug)]
pub enum FoldingRangeKind {
    Comment,
}

#[derive(Clone, Copy, Serialize, Deserialize, Debug)]
pub struct FoldingRange {
    pub start: u32,
    pub end: u32,
    pub kind: FoldingRangeKind,
}

pub(crate) fn folding_ranges(source: &Source) -> Vec<FoldingRange> {
    let mut rv = vec![];

    // find repeated comment folding ranges
    let mut last_comment_folding_range: Option<FoldingRange> = None;
    for (idx, line) in source.lines.iter().enumerate() {
        let line_number = idx + 1;
        if line.starts_with("#") {
            let mut folding_range = FoldingRange {
                start: line_number as u32,
                end: line_number as u32,
                kind: FoldingRangeKind::Comment,
            };

            match last_comment_folding_range {
                Some(ref last_comment_folding_range) => {
                    if last_comment_folding_range.end == folding_range.start - 1 {
                        rv.pop();
                        rv.push(FoldingRange {
                            start: last_comment_folding_range.start,
                            end: folding_range.end,
                            kind: FoldingRangeKind::Comment,
                        });
                        folding_range.start = last_comment_folding_range.start;
                    } else {
                        rv.push(folding_range);
                    }
                }
                None => {
                    rv.push(folding_range);
                }
            }

            last_comment_folding_range = Some(folding_range);
        } else {
            last_comment_folding_range = None;
        }
    }

    return rv;
}

#[cfg(test)]
mod tests {
    use super::folding_ranges;
    use super::Source;
    use insta::assert_yaml_snapshot;

    macro_rules! assert_folding_ranges_match {
        (@$query:literal, @$snapshot:literal) => {
            let source = Source::from($query);
            let rv = folding_ranges(&source);

            assert_yaml_snapshot!(rv, @$snapshot);
        };
    }

    #[test]
    fn comment_test() {
        assert_folding_ranges_match!(
            @r###"from tabale_name"###,
            @r###"---
[]
        "###
        );

        assert_folding_ranges_match!(
                    @r###"
# comment line 1
# comment line 2
from table_name # comment line 3
# comment line 4
"###,
        @r###"---
- start: 2
  end: 3
  kind: Comment
- start: 5
  end: 5
  kind: Comment
"###
                );

        assert_folding_ranges_match!(
                    @r###"
# foo
# bar
# foobar
#foobar
from table_name # inline comment

# foobar
from table_name

# foobar
# foo
# bar
# bar
## foo
"###,
        @r###"---
- start: 2
  end: 5
  kind: Comment
- start: 8
  end: 8
  kind: Comment
- start: 11
  end: 15
  kind: Comment
"###
                );
    }
}
