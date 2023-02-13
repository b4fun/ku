import { Session, TableSchema } from "@b4fun/ku-protos";
import { Monaco } from "@monaco-editor/react";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import prqlSyntax from "./prql-syntax";

export const languageId = "prql";

const sortTextGroupValue = 'a';
const sortTextGroupLanguage = 'b';

const extendedPRQLSyntax = {
  ...prqlSyntax,
} as any as monaco.languages.IMonarchLanguage;

export function setupPRQL(
  monaco: Monaco,
  session: Session,
  currentTable: TableSchema,
): () => void {
  monaco.languages.register({ id: languageId, extensions: ["prql"] });
  const disposeTokensProvider = monaco.languages.setMonarchTokensProvider(
    languageId, extendedPRQLSyntax,
  );

  // TODO: compute with background workers

  const disposeCompletionItemProvider = monaco.languages.registerCompletionItemProvider(languageId, {
    async provideCompletionItems(model, position, context, token) {
      const suggestions = [] as any as monaco.languages.CompletionItem[];

      const textBeforePointer = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      });
      const tokens = textBeforePointer.split(' ')
        .map(t => t.trim())
        .filter(t => !!t);
      if (tokens.length < 1) {
        return { suggestions, incomplete: false };
      }

      const lastToken = tokens[tokens.length - 1];
      const lastTokenRange = {
        startLineNumber: position.lineNumber,
        startColumn: position.column - lastToken.length,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      }
      currentTable.columns.forEach(column => {
        if (column.key.startsWith(lastToken)) {
          suggestions.push({
            label: column.key,
            range: lastTokenRange,
            kind: monaco.languages.CompletionItemKind.Property,
            insertText: column.key,
            sortText: sortTextGroupValue,
            // TODO: documentation
          });
        }
      });
      if (currentTable.name.startsWith(lastToken)) {
        suggestions.push({
          label: currentTable.name,
          range: lastTokenRange,
          kind: monaco.languages.CompletionItemKind.Value,
          insertText: currentTable.name,
          sortText: sortTextGroupValue,
          // TODO: documentation
        });
      }
      extendedPRQLSyntax.keywords.forEach((keyword: string) => {
        if (keyword.startsWith(lastToken)) {
          suggestions.push({
            label: keyword,
            range: lastTokenRange,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: keyword,
            sortText: sortTextGroupLanguage,
          });
        }
      });
      // TODO: seems like operators won't trigger completion
      extendedPRQLSyntax.operators.forEach((op: string) => {
        if (op.startsWith(lastToken)) {
          suggestions.push({
            label: op,
            range: lastTokenRange,
            kind: monaco.languages.CompletionItemKind.Operator,
            insertText: op,
            sortText: sortTextGroupLanguage,
          });
        }
      });

      return { suggestions, incomplete: true };
    },
  });

  // TODO(hbc): parse with prql-lezer
  //            We should take Query / List as folding region
  // References:
  //   - https://github.com/PRQL/prql/blob/main/prql-lezer/src/prql.grammar
  //   - https://github.com/microsoft/vscode-css-languageservice/blob/main/src/services/cssFolding.ts
  const disposeFoldingRangeProvider = monaco.languages.registerFoldingRangeProvider(languageId, {
    async provideFoldingRanges(model, context, token) {
      const value = model.getValue();
      const lines = value.split('\n');

      const foldingRanges: monaco.languages.FoldingRange[] = [];
      let regionStart: number | undefined;
      lines.forEach((line, lineIdx) => {
        line = line.trim();
        if (line === '') {
          if (regionStart) {
            foldingRanges.push({
              start: regionStart,
              end: lineIdx,
              kind: monaco.languages.FoldingRangeKind.Region,
            });
            regionStart = undefined;
          }
        } else if (!regionStart) {
          regionStart = lineIdx + 1;
        }
      });
      if (regionStart) {
        foldingRanges.push({
          start: regionStart,
          end: lines.length,
          kind: monaco.languages.FoldingRangeKind.Region,
        });
      }

      return foldingRanges;
    },
  });

  return () => {
    disposeFoldingRangeProvider.dispose();
    disposeCompletionItemProvider.dispose();
    disposeTokensProvider.dispose();
  };
}
