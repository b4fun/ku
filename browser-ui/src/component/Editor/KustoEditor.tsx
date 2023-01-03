import { Skeleton } from "@mantine/core";
import Editor, { loader, OnMount, useMonaco } from "@monaco-editor/react";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { useEffect, useState } from "react";
import { useSetEditor } from "../../atom/editorAtom";
import * as prql from "./prql";
import {
  createOnigScanner,
  createOnigString,
  loadWASM,
} from "vscode-oniguruma";
// import { SimpleLanguageInfoProvider } from "./providers";
import { INITIAL, parseRawGrammar, Registry, StateStack } from "vscode-textmate";
import { ScopeName } from "./providers";
import { IRawGrammar } from "vscode-textmate/release/rawGrammar";
import theme from "./theme";
import {Color} from 'monaco-editor/esm/vs/base/common/color';
import {TokenizationRegistry} from 'monaco-editor/esm/vs/editor/common/languages';
import {generateTokensCSSForColorMap} from 'monaco-editor/esm/vs/editor/common/languages/supports/tokenization';

let promiseResolve: (v: any) => void;
const monacoKustoInitPromise = new Promise((resolve) => {
  promiseResolve = resolve;
});

function loadMonacoKusto() {
  console.log("loading kusto");

  const script = document.createElement("script");
  script.innerHTML = `require(['vs/language/kusto/monaco.contribution'], function() {
    console.log('kusto/monaco loaded');
    document.dispatchEvent(new Event('kusto_init'));
  });`;
  return document.body.appendChild(script);
}

function onMonacoKustoLoaded() {
  document.removeEventListener("kusto_init", onMonacoKustoLoaded);
  promiseResolve(window);
}

loader.config({
  paths: {
    vs: `/monaco-editor/min/vs`,
  },
});

loader.init().then(() => {
  document.addEventListener("kusto_init", onMonacoKustoLoaded);
  loadMonacoKusto();
});

export { type OnMount };

export interface KustoEditorProps {
  editorValue: string;
}

export default function KustoEditor(props: KustoEditorProps) {
  const { editorValue } = props;

  const monaco = useMonaco();
  const [loading, setLoading] = useState(true);

  const setEditor = useSetEditor();

  useEffect(() => {
    if (!monaco) {
      return;
    }

    monacoKustoInitPromise.then(() => {
      const langId = "prql";
      monaco.languages.register({ id: langId });
      // monaco.editor.defineTheme('dark', theme as any);

      monaco.languages.onLanguage(langId, async () => {
        console.log("on language");

        const data: ArrayBuffer | Response = await loadVSCodeOnigurumWASM();
        loadWASM(data);
        const onigLib = Promise.resolve({
          createOnigScanner,
          createOnigString,
        });

        const registry = new Registry({
          onigLib,

          async loadGrammar(scopeName: ScopeName): Promise<IRawGrammar | null> {
            console.log('loadGrammar');

            return parseRawGrammar(JSON.stringify(prql.grammars), `prql.json`);
          },

          getInjections(scopeName: ScopeName): string[] | undefined {
            console.log('getInjections');

            return undefined;
          },

          theme,
        });

        const scopeName = 'source.prql';
        const encodedLanguageId = monaco.languages.getEncodedLanguageId(langId);
        const grammar = await registry.loadGrammarWithConfiguration(scopeName, encodedLanguageId, {});

        const cssColors = registry.getColorMap();
        const colorMap = cssColors.map(Color.Format.CSS.parseHex);
        TokenizationRegistry.setColorMap(colorMap);
        const css = generateTokensCSSForColorMap(colorMap);
        const style = createStyleElementForColorsCSS();
        style.innerHTML = css;

        /*
        const provider = new SimpleLanguageInfoProvider({
          grammars: {},
          fetchGrammar: async (scopeName: string) => { throw new Error("Not implemented"); },
          configurations: prql.configuration as any,
          fetchConfiguration: async (scopeName: string) => { throw new Error("Not implemented"); },
          theme: {} as any,
          onigLib,
          monaco,
        });

        console.log(provider);
        */

        monaco.languages.setTokensProvider(
          langId,
          {
            getInitialState: () => {
              return INITIAL;
            },
            tokenizeEncoded(line, state) {
              const tokenizeLineResult = grammar!.tokenizeLine2(line, state as StateStack);

              return {
                tokens: tokenizeLineResult!.tokens,
                endState: tokenizeLineResult!.ruleStack,
              };
            },
          }
        );
        monaco.languages.setLanguageConfiguration(
          langId,
          prql.configuration as any
        );
      });

      setLoading(false);
    });
  }, [monaco]);

  if (loading) {
    return <Skeleton height={50} />;
  }

  const editorOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
    fontSize: 14,
    minimap: { enabled: false },
  };

  return (
    <Editor
      className="mt-1"
      // language='kusto'
      language="prql"
      defaultValue={editorValue}
      onMount={setEditor}
      options={editorOptions}
    />
  );
}

async function loadVSCodeOnigurumWASM(): Promise<Response | ArrayBuffer> {
  const response = await fetch(
    "/vscode-oniguruma/onig.wasm"
  );
  const contentType = response.headers.get("content-type");
  if (contentType === "application/wasm") {
    return response;
  }

  // Using the response directly only works if the server sets the MIME type 'application/wasm'.
  // Otherwise, a TypeError is thrown when using the streaming compiler.
  // We therefore use the non-streaming compiler :(.
  return await response.arrayBuffer();
}

function createStyleElementForColorsCSS(): HTMLStyleElement {
  // We want to ensure that our <style> element appears after Monaco's so that
  // we can override some styles it inserted for the default theme.
  const style = document.createElement('style');

  // We expect the styles we need to override to be in an element with the class
  // name 'monaco-colors' based on:
  // https://github.com/microsoft/vscode/blob/f78d84606cd16d75549c82c68888de91d8bdec9f/src/vs/editor/standalone/browser/standaloneThemeServiceImpl.ts#L206-L214
  const monacoColors = document.getElementsByClassName('monaco-colors')[0];
  if (monacoColors) {
    monacoColors.parentElement?.insertBefore(style, monacoColors.nextSibling);
  } else {
    // Though if we cannot find it, just append to <head>.
    let {head} = document;
    if (head == null) {
      head = document.getElementsByTagName('head')[0];
    }
    head?.appendChild(style);
  }
  return style;
}