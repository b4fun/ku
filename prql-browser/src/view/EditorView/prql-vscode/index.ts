import { Session, TableSchema } from "@b4fun/ku-protos";
import { lsp_folding_ranges } from "@b4fun/ku-prql-js/dist/bundler";
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

  const disposeFoldingRangeProvider = monaco.languages.registerFoldingRangeProvider(languageId, {
    async provideFoldingRanges(model, context, token) {
      return lspFoldingRanges(model.getValue());
    },
  });

  return () => {
    disposeFoldingRangeProvider.dispose();
    disposeCompletionItemProvider.dispose();
    disposeTokensProvider.dispose();
  };
}

// TODO: export types from prql-js
type LSPFoldingRanges = {
  start: number;
  end: number;
  kind: string;
};

function lspFoldingRangeKindToMonacoFoldingRangeKind(k: string): monaco.languages.FoldingRangeKind {
  switch (k) {
    case "Comment":
      return monaco.languages.FoldingRangeKind.Comment;
    default:
      return monaco.languages.FoldingRangeKind.Region;
  }
}

function lspFoldingRangesToMonacoFoldingRanges(
  lspFoldingRanges: LSPFoldingRanges[],
): monaco.languages.FoldingRange[] {
  return lspFoldingRanges.map(lspFoldingRange => ({
    start: lspFoldingRange.start,
    end: lspFoldingRange.end,
    kind: lspFoldingRangeKindToMonacoFoldingRangeKind(lspFoldingRange.kind),
  }));
}

function lspFoldingRanges(s: string): monaco.languages.FoldingRange[] {
  const lspFoldingRangesEncoded = lsp_folding_ranges(s);
  const lspFoldingRanges: LSPFoldingRanges[] = JSON.parse(lspFoldingRangesEncoded);
  return lspFoldingRangesToMonacoFoldingRanges(lspFoldingRanges);
}