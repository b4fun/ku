import { Monaco } from "@monaco-editor/react";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import prqlSyntax from "./prql-syntax";

export const languageId = "prql";

export function setupPRQL(monaco: Monaco) {
  monaco.languages.register({ id: languageId, extensions: ["prql"] });
  monaco.languages.setMonarchTokensProvider(languageId, prqlSyntax as any);

  // TODO: completion
  if (false) {
    monaco.languages.registerCompletionItemProvider(languageId, {
      async provideCompletionItems(model, position, context, token) {
        const line = model.getLineContent(position.lineNumber);

        const suggestions = [] as any as monaco.languages.CompletionItem[];

        return { suggestions, incomplete: false };
      },
    });
  }
}
