use std::collections::HashMap;

use anyhow::Result;
use prql_compiler::ast::pl::TableExternRef;
use prql_compiler::ast::rq::{fold_relation_kind, RelationKind, RqFold, TId};
use prql_compiler::ast::rq::{fold_table, fold_table_ref, TableDecl, TableRef};
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

#[derive(Clone, Serialize, Deserialize)]
pub(crate) struct RenameTablesOptions {
    /// List of tables to rename. (old_name -> new_name)
    pub names: HashMap<String, String>,
}

impl Default for RenameTablesOptions {
    fn default() -> Self {
        Self {
            names: HashMap::new(),
        }
    }
}

impl From<&JsValue> for RenameTablesOptions {
    fn from(js_value: &JsValue) -> Self {
        if js_value.is_string() {
            Self::from(js_value.as_string().unwrap())
        } else {
            Self::default()
        }
    }
}

impl From<String> for RenameTablesOptions {
    fn from(json_encoded: String) -> Self {
        match serde_json::from_str(json_encoded.as_str()) {
            Ok(v) => v,
            _ => Self::default(),
        }
    }
}

pub(crate) struct BookkeepTables {
    /// List of names to rename. (old_name -> new_name)
    name_to_names: HashMap<String, String>,
    /// List of tables with new names. (table_id -> new_name)
    id_to_names: HashMap<TId, String>,
}

impl From<RenameTablesOptions> for BookkeepTables {
    fn from(options: RenameTablesOptions) -> Self {
        Self {
            name_to_names: options.names.clone(),
            id_to_names: HashMap::new(),
        }
    }
}

impl From<&JsValue> for BookkeepTables {
    fn from(js_value: &JsValue) -> Self {
        Self::from(RenameTablesOptions::from(js_value))
    }
}

impl BookkeepTables {
    fn bookkeep_table(&mut self, table_id: TId, table_name: Option<String>) {
        match table_name {
            Some(ref name) => match self.name_to_names.get(name) {
                Some(new_name) => {
                    self.id_to_names.insert(table_id, new_name.to_string());
                    _ = {}
                }
                None => {}
            },
            None => {}
        }
    }
}

impl RqFold for BookkeepTables {
    fn fold_table(&mut self, table: TableDecl) -> Result<TableDecl> {
        self.bookkeep_table(table.id, table.name.clone());

        fold_table(self, table)
    }

    fn fold_table_ref(&mut self, table_ref: TableRef) -> Result<TableRef> {
        self.bookkeep_table(table_ref.source, table_ref.name.clone());

        fold_table_ref(self, table_ref)
    }
}

impl From<BookkeepTables> for RenameTables {
    fn from(bookkeep: BookkeepTables) -> Self {
        Self {
            name_to_names: bookkeep.name_to_names.clone(),
            id_to_names: bookkeep.id_to_names.clone(),
        }
    }
}

pub(crate) struct RenameTables {
    /// List of tables to rename. (table id -> new name)
    id_to_names: HashMap<TId, String>,
    /// List of tables to rename. (table name -> new name)
    name_to_names: HashMap<String, String>,
}

impl RenameTables {
    fn rename_table_by_id(&mut self, table_id: TId, table_name: Option<String>) -> Option<String> {
        match table_name {
            Some(ref name) => match self.id_to_names.get(&table_id) {
                Some(new_name) => Some(new_name.clone()),
                None => Some(name.clone()),
            },
            None => None,
        }
    }

    fn rename_table_by_name(&mut self, original_name: String) -> String {
        match self.name_to_names.get(&original_name) {
            Some(new_name) => new_name.clone(),
            None => original_name.clone(),
        }
    }
}

impl RqFold for RenameTables {
    fn fold_table(&mut self, table: TableDecl) -> Result<TableDecl> {
        match fold_table(self, table) {
            Result::Ok(mut rv) => {
                rv.name = self.rename_table_by_id(rv.id, rv.name);
                Result::Ok(rv)
            }
            Result::Err(err) => Err(err),
        }
    }

    fn fold_table_ref(&mut self, table_ref: TableRef) -> Result<TableRef> {
        match fold_table_ref(self, table_ref) {
            Result::Ok(mut rv) => {
                rv.name = self.rename_table_by_id(rv.source, rv.name);
                Result::Ok(rv)
            }
            Result::Err(err) => Err(err),
        }
    }

    fn fold_relation_kind(&mut self, rel_kind: RelationKind) -> Result<RelationKind> {
        match rel_kind {
            RelationKind::ExternRef(ref table_ref) => match table_ref {
                TableExternRef::LocalTable(table_name) => {
                    let new_rel_kind = RelationKind::ExternRef(TableExternRef::LocalTable(
                        self.rename_table_by_name(table_name.clone()),
                    ));

                    fold_relation_kind(self, new_rel_kind)
                }
                _ => fold_relation_kind(self, rel_kind),
            },
            _ => fold_relation_kind(self, rel_kind),
        }
    }
}

#[cfg(test)]
mod tests {
    use insta::assert_yaml_snapshot;
    use prql_compiler::ast::rq::RqFold;
    use std::collections::HashMap;

    use crate::rename_table::{BookkeepTables, RenameTables, RenameTablesOptions};

    impl RenameTablesOptions {
        fn with_names<F: FnOnce(&mut HashMap<String, String>)>(mut self, f: F) -> Self {
            f(&mut self.names);
            self
        }
    }

    macro_rules! assert_rename_table_match {
        ($options:expr, @$query:literal, @$snapshot:literal) => {
            let mut bookkeeper = BookkeepTables::from($options);

            let pl = prql_compiler::prql_to_pl($query);
            assert!(pl.is_ok());
            let query = prql_compiler::semantic::resolve(pl.unwrap())
                .and_then(|q| bookkeeper.fold_query(q))
                .and_then(|q| RenameTables::from(bookkeeper).fold_query(q));
            assert!(query.is_ok());

            assert_yaml_snapshot!(query.unwrap(), @$snapshot);
        };
    }

    #[test]
    fn rename_table_test() {
        assert_rename_table_match!(
            RenameTablesOptions::default(),
            @"from foo",
            @r###"---
def:
  version: ~
  other: {}
tables:
  - id: 0
    name: ~
    relation:
      kind:
        ExternRef:
          LocalTable: foo
      columns:
        - Wildcard
relation:
  kind:
    Pipeline:
      - From:
          source: 0
          columns:
            - - Wildcard
              - 0
          name: foo
      - Select:
          - 0
  columns:
    - Wildcard"###
        );

        assert_rename_table_match!(
            RenameTablesOptions::default().with_names(|names| {
                names.insert("foo".to_owned(), "bar".to_owned());
            }),
            @"from foo",
            @r###"---
def:
  version: ~
  other: {}
tables:
  - id: 0
    name: ~
    relation:
      kind:
        ExternRef:
          LocalTable: bar
      columns:
        - Wildcard
relation:
  kind:
    Pipeline:
      - From:
          source: 0
          columns:
            - - Wildcard
              - 0
          name: bar
      - Select:
          - 0
  columns:
    - Wildcard"###
        );
    }
}
