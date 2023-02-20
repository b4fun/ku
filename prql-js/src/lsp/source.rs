use prql_compiler::{ast, ErrorMessages};

pub struct Source {
    pub(crate) lines: Vec<String>,
    pub(crate) pl: Result<Vec<ast::pl::Stmt>, ErrorMessages>,
}

impl From<String> for Source {
    fn from(source: String) -> Self {
        let lines = source.lines().map(|s| s.to_string()).collect();
        let pl = prql_compiler::prql_to_pl(source.as_str());
        Self { lines, pl }
    }
}

impl From<&str> for Source {
    fn from(source: &str) -> Self {
        Self::from(source.to_string())
    }
}
