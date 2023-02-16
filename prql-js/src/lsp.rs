use self::folding_ranges::FoldingRange;

mod folding_ranges;

pub struct Analysis {}

impl Analysis {
    pub fn folding_ranges(&self) -> Vec<FoldingRange> {
        folding_ranges::folding_ranges()
    }
}
