import { compile } from "prql-js/dist/bundler";

export function compileToSQL(query: string): string {
  const result = compile(query);

  if (result.error) {
    throw new Error(result.error.message);
  }

  if (!result.sql) {
    throw new Error("failed to compile to sql");
  }

  return result.sql;
}
