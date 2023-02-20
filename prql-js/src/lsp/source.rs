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

impl Source {
    pub(crate) fn span_pos_to_line(&self, span_pos: usize) -> usize {
        let mut current_pos = 0;
        for (i, line_content) in self.lines.iter().enumerate() {
            let line = i + 1;
            current_pos += line_content.len() + 1;
            if current_pos > span_pos {
                return line;
            }
        }

        0
    }
}
