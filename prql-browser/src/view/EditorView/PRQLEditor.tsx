import 'monaco-editor/esm/vs/editor/standalone/browser/accessibilityHelp/accessibilityHelp.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/inspectTokens/inspectTokens.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/iPadShowKeyboard/iPadShowKeyboard.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneCommandsQuickAccess.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneGotoLineQuickAccess.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneGotoSymbolQuickAccess.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneHelpQuickAccess.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/quickInput/standaloneQuickInputService.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/referenceSearch/standaloneReferenceSearch.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/toggleHighContrast/toggleHighContrast.js';

import { Session, TableSchema } from "@b4fun/ku-protos";
import { Skeleton } from "@mantine/core";
import Editor, { useMonaco } from "@monaco-editor/react";
import { debounce } from "lodash";
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';
import { MonacoServices } from "monaco-languageclient/.";
import { useEffect, useRef, useState } from "react";
import { BrowserMessageReader, BrowserMessageWriter } from 'vscode-languageserver-protocol/browser.js';
import getMessageServiceOverride from 'vscode/service-override/messages';
import { StandaloneServices } from 'vscode/services';
import { useEditorContent, useLoadedEditor, useSetEditor } from "../../atom/editorAtom";
import { sessionHash } from "../../atom/sessionAtom";
import { createLanguageClient, languageId, setupPRQL } from "./prql-vscode";

StandaloneServices.initialize({
  ...getMessageServiceOverride(document.body)
});

export interface PRQLEditorProps {
  editorValue: string;
  table: TableSchema;
  session: Session;
}

export function PRQLEditor2(props: PRQLEditorProps) {
  const { editorValue, table, session } = props;
  const monaco = useMonaco();
  const [loading, setLoading] = useState(true);
  const setEditor = useSetEditor();
  const [loadedEditor] = useLoadedEditor();
  const key = sessionHash(session, [table]);
  const [, setEditorContent] = useEditorContent(session, table);

  useEffect(() => {
    if (!monaco) {
      return;
    }

    const uninstallPRQL = setupPRQL(monaco, session, table);

    setLoading(false);

    return uninstallPRQL;
  }, [monaco, key]);

  useEffect(() => {
    if (!monaco) {
      return;
    }

    MonacoServices.install();

    const workerSource = process.env.NODE_ENV === 'production' ? '/sw.js' : './src/sw.ts';

    const worker = new Worker(
      new URL(workerSource, window.location.href).href,
      { type: 'module' },
    );
    worker.onerror = (e) => {
      console.log('worker error', e);
    };
    worker.onmessage = (m) => {
      console.log(m);
    }
    const reader = new BrowserMessageReader(worker);
    const writer = new BrowserMessageWriter(worker);
    const languageClient = createLanguageClient({ reader, writer });
    reader.onClose(() => languageClient.stop());

    languageClient.start();

    return () => {
      worker.terminate();
      reader.dispose();
    };
  }, [monaco]);


  if (loading) {
    return <Skeleton height={50} />;
  }

  return (
    <Editor
      key={key}
      language={languageId}
      defaultValue={editorValue}
      onMount={setEditor}
      onChange={debounce(
        (value) => setEditorContent(value || '')
      )}
      options={{
        fontSize: 14,
        minimap: { enabled: false },
      }}
    />
  );
}

export function PRQLEditor(props: PRQLEditorProps) {
  const { editorValue, table, session } = props;
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current === null) {
      return;
    }

    console.log('install start');

    // const uninstallPRQL = setupPRQL(monaco, session, table);
    monaco.languages.register({ id: languageId, extensions: ["prql"] });

    const modelUri = monaco.Uri.parse('inmemory://query.prql');
    let model = monaco.editor.getModel(modelUri);
    if (!model) {
      model = monaco.editor.createModel(editorValue, languageId, modelUri);
    }

    editorRef.current = monaco.editor.create(
      ref.current!,
      {
        model,
        glyphMargin: false,
        lightbulb: {
          enabled: true
        },
        fontSize: 14,
        minimap: { enabled: false },
      },
    );

    MonacoServices.install();

    const workerSource = process.env.NODE_ENV === 'production' ? '/sw.js' : './src/sw.ts';

    const worker = new Worker(
      new URL(workerSource, window.location.href).href,
      { type: 'module' },
    );
    worker.onerror = (e) => {
      console.log('worker error', e);
    };
    worker.onmessage = (m) => {
      console.log(m);
    }
    const reader = new BrowserMessageReader(worker);
    const writer = new BrowserMessageWriter(worker);
    const languageClient = createLanguageClient({ reader, writer });
    reader.onClose(() => languageClient.stop());

    languageClient.start();

    return () => {
      // uninstallPRQL();
      editorRef.current?.dispose();
      worker.terminate();
      reader.dispose();
    };
  }, [ref.current]);

  return (
    <div
      ref={ref}
      style={{ height: '100%' }}
    >

    </div>
  );
}