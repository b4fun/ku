import { compile, Dialect, SQLCompileOptions } from "@b4fun/ku-prql-js/dist/bundler";

export interface RenameTablesOption {
  names: Record<string, string>;
}

export function compileToSQL(query: string, renameTablesOption: RenameTablesOption): string {
  const compileOpts = new SQLCompileOptions();
  compileOpts.dialect = Dialect.SQLite;
  compileOpts.format = true;
  compileOpts.signature_comment = false;

  const result = compile(
    query,
    compileOpts,
    JSON.stringify(renameTablesOption),
  );

  if (!result) {
    throw new Error("failed to compile to sql");
  }

  return result;
}
