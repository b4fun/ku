mod utils;

use std::collections::HashMap;

use anyhow::Result;
use prql_compiler::ast::pl::TableExternRef;
use prql_compiler::ast::rq::{fold_relation_kind, RelationKind, RqFold, TId};
use prql_compiler::ast::rq::{fold_table, fold_table_ref, TableDecl, TableRef};
use prql_compiler::sql;
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
pub fn compile(
    prql_query: &str,
    compile_options: Option<SQLCompileOptions>,
    rename_table_options: &JsValue,
) -> Option<String> {
    let mut rename_bookkeeper = BookkeepTables::from(rename_table_options);

    let pl = prql_compiler::prql_to_pl(prql_query);
    match pl {
        Err(e) => wasm_bindgen::throw_str(&e.to_json()),
        _ => {}
    }

    let pipeline = prql_compiler::semantic::resolve(pl.unwrap())
        .and_then(|query| rename_bookkeeper.fold_query(query))
        .and_then(|query| RenameTables::from(rename_bookkeeper).fold_query(query))
        .and_then(|query| sql::compile(query, compile_options.map(|x| x.into())))
        .map_err(prql_compiler::downcast)
        .map_err(|e| e.composed("", prql_query, false));

    return_or_throw(pipeline)
}

fn return_or_throw(result: Result<String, prql_compiler::ErrorMessages>) -> Option<String> {
    match result {
        Ok(sql) => Some(sql),
        Err(e) => wasm_bindgen::throw_str(&e.to_json()),
    }
}

#[derive(Clone, Serialize, Deserialize)]
struct RenameTablesOptions {
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
            Ok(v) => {
                println!("here");
                v
            }
            _ => {
                println!("foo");
                Self::default()
            }
        }
    }
}

struct BookkeepTables {
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

struct RenameTables {
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

// NOTE: copied from https://github.com/PRQL/prql/blob/ff484401bc1e7880c0f0ecbdceb2af3aa9b7e64b/prql-js/src/lib.rs

/// Compilation options for SQL backend of the compiler.
#[wasm_bindgen]
#[derive(Clone)]
pub struct SQLCompileOptions {
    /// Pass generated SQL string trough a formatter that splits it
    /// into multiple lines and prettifies indentation and spacing.
    ///
    /// Defaults to true.
    pub format: bool,

    /// Target dialect you want to compile for.
    ///
    /// Because PRQL compiles to a subset of SQL, not all SQL features are
    /// required for PRQL. This means that generic dialect may work with most
    /// databases.
    ///
    /// If something does not work in dialect you need, please report it at
    /// GitHub issues.
    ///
    /// If None is used, `sql_dialect` flag from query definition is used.
    /// If it does not exist, [Dialect::Generic] is used.
    pub dialect: Option<Dialect>,

    /// Emits the compiler signature as a comment after generated SQL
    ///
    /// Defaults to true.
    pub signature_comment: bool,
}

pub fn default_compile_options() -> SQLCompileOptions {
    SQLCompileOptions {
        format: true,
        dialect: None,
        signature_comment: true,
    }
}

#[wasm_bindgen]
impl SQLCompileOptions {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        default_compile_options()
    }
}

impl From<SQLCompileOptions> for prql_compiler::sql::Options {
    fn from(o: SQLCompileOptions) -> Self {
        prql_compiler::sql::Options {
            format: o.format,
            dialect: o.dialect.map(From::from),
            signature_comment: o.signature_comment,
        }
    }
}

#[wasm_bindgen]
#[derive(Clone, Copy)]
pub enum Dialect {
    Ansi,
    BigQuery,
    ClickHouse,
    Generic,
    Hive,
    MsSql,
    MySql,
    PostgreSql,
    SQLite,
    Snowflake,
    DuckDb,
}

impl From<Dialect> for prql_compiler::sql::Dialect {
    fn from(d: Dialect) -> Self {
        use prql_compiler::sql::Dialect as D;
        match d {
            Dialect::Ansi => D::Ansi,
            Dialect::BigQuery => D::BigQuery,
            Dialect::ClickHouse => D::ClickHouse,
            Dialect::Generic => D::Generic,
            Dialect::Hive => D::Hive,
            Dialect::MsSql => D::MsSql,
            Dialect::MySql => D::MySql,
            Dialect::PostgreSql => D::PostgreSql,
            Dialect::SQLite => D::SQLite,
            Dialect::Snowflake => D::Snowflake,
            Dialect::DuckDb => D::DuckDb,
        }
    }
}
