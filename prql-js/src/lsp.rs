mod folding_ranges;
pub mod source;

pub struct Analysis {}

impl Analysis {
    pub fn folding_ranges(&self, source: &source::Source) -> Vec<folding_ranges::FoldingRange> {
        folding_ranges::folding_ranges(source)
    }
}
