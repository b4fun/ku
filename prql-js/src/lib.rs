mod lsp;
mod rename_table;
mod utils;

use anyhow::Result;
use prql_compiler::ast::rq::RqFold;
use prql_compiler::sql;
use rename_table::{BookkeepTables, RenameTables};
use wasm_bindgen::prelude::*;

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

#[wasm_bindgen]
pub fn lsp_folding_ranges(prql_query: &str) -> Option<String> {
    return_or_throw(Ok("result".to_string()))
}

#[test]
fn foo_test() {
    let pl = prql_compiler::prql_to_pl(
        r#"from f
        sele x
"#,
    );
    assert!(pl.is_ok());
    println!("{:#?}", pl);
    for ele in pl.clone().unwrap() {
        match ele.span {
            Some(span) => {
                println!("span: {}, {}", span.start, span.end);
            }
            None => {}
        }
    }

    let std_ctx = prql_compiler::semantic::load_std_lib();
    println!(
        "resolve only: {:#?}",
        prql_compiler::semantic::resolve_only(pl.clone().unwrap(), Some(std_ctx))
    );

    let rl = prql_compiler::semantic::resolve(pl.clone().unwrap());
    match rl {
        Ok(query) => {
            println!("{:#?}", query);
        }
        Err(err) => {
            println!("err {:#?}", err);
        }
    }
}

// completion idea:
// 1. send the whole model text for parsing (don't cache document for now)
// 2. provide namings context (keyword names, available table names, function names etc)
// 3. get the parent / previous / next expr item in the requested position
// 4. generate completions

// diagnostic idea:
// 1. send the whole model text
// 2. split into blocks for parsing, then semantic resolve
// 3. emit notifications for parse failure
