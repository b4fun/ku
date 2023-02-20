use anyhow::Result;
use prql_compiler::ast::pl::fold::{fold_pipeline, AstFold};
use prql_compiler::ast::pl::{Expr, ExprKind, Pipeline};
use serde::{Deserialize, Serialize};

use super::source::Source;

#[derive(Clone, Copy, Serialize, Deserialize, Debug)]
pub enum FoldingRangeKind {
    Comment,
    List,
    Parentheses,
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

    let mut folder = FoldingRangesFolder {
        source,
        folding_ranges: vec![],
    };

    if let Ok(ref stmts) = source.pl {
        _ = folder.fold_stmts(stmts.clone());
    }

    rv.append(&mut folder.folding_ranges);

    return rv;
}

struct FoldingRangesFolder<'a> {
    source: &'a Source,
    folding_ranges: Vec<FoldingRange>,
}

impl AstFold for FoldingRangesFolder<'_> {
    fn fold_expr(&mut self, mut expr: Expr) -> Result<Expr> {
        expr.kind = self.fold_expr_kind(expr.kind)?;

        // TODO: fold parentheses
        match expr.kind {
            ExprKind::List(_) => {
                if let Some(span) = expr.span {
                    let span_start_line = self.source.span_pos_to_line(span.start);
                    let span_end_line = self.source.span_pos_to_line(span.end);
                    if span_start_line != span_end_line {
                        self.folding_ranges.push(FoldingRange {
                            start: span_start_line as u32,
                            end: span_end_line as u32,
                            kind: FoldingRangeKind::List,
                        });
                    }
                }
            }
            _ => {}
        }

        Ok(expr)
    }
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

    #[test]
    fn examples_test() {
        assert_folding_ranges_match!(
                    @r###"
from invoices
filter invoice_date >= @1970-01-16
derive [
  transaction_fees = 0.8,
  income = total - transaction_fees
]
filter income > 1
group customer_id (
  aggregate [
    average total,
    sum_income = sum income,
    ct = count,
  ]
)
sort [-sum_income]
take 10
join c=customers [==customer_id]
derive name = f"{c.last_name}, {c.first_name}"
select [
  c.customer_id, name, sum_income
]
derive db_version = s"version()"
"###,
        @r###"---
- start: 4
  end: 7
  kind: List
- start: 10
  end: 14
  kind: List
- start: 20
  end: 22
  kind: List
        "###
                );
    }
}
