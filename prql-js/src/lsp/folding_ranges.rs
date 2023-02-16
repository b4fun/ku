pub enum FoldingRangeKind {
    Comment,
}

pub struct FoldingRange {
    pub start: u32,
    pub end: u32,
    pub kind: FoldingRangeKind,
}

pub fn folding_ranges() -> Vec<FoldingRange> {
    let mut rv = vec![];

    return rv;
}
