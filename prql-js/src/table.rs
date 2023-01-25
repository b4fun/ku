use std::collections::HashMap;

use anyhow::Result;
use prql_compiler::ast::pl::TableExternRef;
use prql_compiler::ast::rq::{fold_relation_kind, RelationKind, RqFold, TId};
use prql_compiler::ast::rq::{fold_table, fold_table_ref, TableDecl, TableRef};
use prql_compiler::{pl_to_rq, prql_to_pl, rq_to_sql};

pub struct RenameTablesOptions {
    /// List of tables to rename. (old_name -> new_name)
    pub names: HashMap<String, String>,
}

struct BookkeepTables {
    /// List of names to rename. (old_name -> new_name)
    names: HashMap<String, String>,
    /// List of tables with new names. (table_id -> new_name)
    loaded_names: HashMap<TId, String>,
}

impl From<RenameTablesOptions> for BookkeepTables {
    fn from(options: RenameTablesOptions) -> Self {
        Self {
            names: options.names.clone(),
            loaded_names: HashMap::new(),
        }
    }
}

impl BookkeepTables {
    fn bookkeep_table(&mut self, table_id: TId, table_name: Option<String>) {
        match table_name {
            Some(ref name) => match self.names.get(name) {
                Some(new_name) => {
                    self.loaded_names.insert(table_id, new_name.to_string());
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
            names: bookkeep.loaded_names.clone(),
        }
    }
}

struct RenameTables {
    /// List of tables to rename. (table id -> new name)
    names: HashMap<TId, String>,
}

impl RenameTables {
    fn rename_table(&mut self, table_id: TId, table_name: Option<String>) -> Option<String> {
        match table_name {
            Some(ref name) => match self.names.get(&table_id) {
                Some(new_name) => Some(new_name.clone()),
                None => Some(name.clone()),
            },
            None => None,
        }
    }
}

impl RqFold for RenameTables {
    fn fold_table(&mut self, table: TableDecl) -> Result<TableDecl> {
        match fold_table(self, table) {
            Result::Ok(mut rv) => {
                rv.name = self.rename_table(rv.id, rv.name);
                Result::Ok(rv)
            }
            Result::Err(err) => Err(err),
        }
    }

    fn fold_table_ref(&mut self, table_ref: TableRef) -> Result<TableRef> {
        match fold_table_ref(self, table_ref) {
            Result::Ok(mut rv) => {
                rv.name = self.rename_table(rv.source, rv.name);
                Result::Ok(rv)
            }
            Result::Err(err) => Err(err),
        }
    }

    // fn fold_relation_kind(&mut self, rel_kind: RelationKind) -> Result<RelationKind> {
    //     match rel_kind {
    //         RelationKind::ExternRef(ref table_ref) => match table_ref {
    //             TableExternRef::LocalTable(table_name) => {
    //                 if table_name == "foo" {
    //                     return Ok(prql_compiler::ast::rq::RelationKind::ExternRef(
    //                         prql_compiler::ast::pl::TableExternRef::LocalTable("foox".to_string()),
    //                     ));
    //                 }

    //                 fold_relation_kind(self, rel_kind)
    //             }
    //         },
    //         _ => fold_relation_kind(self, rel_kind),
    //     }
    // }
}
