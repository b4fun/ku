mod utils;

use prql_compiler::sql::Options;
use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
pub fn compile(prql_query: &str) -> Option<String> {
    return_or_throw(
        prql_compiler::compile(
            prql_query,
            Some(Options {
                format: true,
                dialect: None,
                signature_comment: false,
            }),
        )
        .map_err(|e| e.composed("", prql_query, false)),
    )
}

fn return_or_throw(result: Result<String, prql_compiler::ErrorMessages>) -> Option<String> {
    match result {
        Ok(sql) => Some(sql),
        Err(e) => wasm_bindgen::throw_str(&e.to_json()),
    }
}
