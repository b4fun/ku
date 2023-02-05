import 'monaco-editor/esm/vs/editor/editor.all.js';
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
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';
import { useEffect, useRef } from "react";
import { BrowserMessageReader, BrowserMessageWriter } from 'vscode-languageserver-protocol/browser.js';
import getMessageServiceOverride from 'vscode/service-override/messages';
import { StandaloneServices } from 'vscode/services';
import { useEditorContent, useSetEditor } from "../../atom/editorAtom";
import { documentUriParamsSessionId, sessionHash } from "../../atom/sessionAtom";
import { createLanguageClient, languageId, setupPRQL } from "./prql-vscode";

StandaloneServices.initialize({
  ...getMessageServiceOverride(document.body)
});

function documentUri(session: Session, tables: TableSchema[]): monaco.Uri {
  const params = new URLSearchParams();
  params.set(documentUriParamsSessionId, session.id);

  const uri = monaco.Uri.parse(`inmemory://${sessionHash(session, tables)}.prql`);
  return uri.with({
    query: params.toString(),
  });
}

export interface PRQLEditorProps {
  editorValue: string;
  table: TableSchema;
  session: Session;
}

export function PRQLEditor(props: PRQLEditorProps) {
  const { editorValue, table, session } = props;
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>();
  const ref = useRef<HTMLDivElement>(null);
  const setEditor = useSetEditor();
  const key = sessionHash(session, [table]);
  const [, setEditorContent] = useEditorContent(session, table);

  useEffect(() => {
    const uninstallPRQL = setupPRQL(monaco);

    const workerSource = process.env.NODE_ENV === 'production' ? '/sw.js' : './src/sw.ts';
    const worker = new Worker(
      new URL(workerSource, window.location.href).href,
      { type: 'module' },
    );
    worker.onerror = (e) => {
      console.log('worker error', e);
    };
    const reader = new BrowserMessageReader(worker);
    const writer = new BrowserMessageWriter(worker);
    const languageClient = createLanguageClient({ reader, writer });
    reader.onClose(() => languageClient.stop());

    languageClient.start();

    return () => {
      uninstallPRQL();
      worker.terminate();
      reader.dispose();
    };
  }, []);

  useEffect(() => {
    if (ref.current === null) {
      return;
    }

    const modelUri = documentUri(session, [table]);
    let model = monaco.editor.getModel(modelUri);
    if (!model) {
      model = monaco.editor.createModel(editorValue, languageId, modelUri);
      console.log(model);
    }

    editorRef.current = monaco.editor.create(
      ref.current!,
      {
        model,
        fontSize: 14,
        minimap: { enabled: false },
      },
    );
    editorRef.current.onDidChangeModelContent(e => {
      if (editorRef.current) {
        setEditorContent(editorRef.current.getValue());
      }
    });

    setEditor(editorRef.current, monaco);

    return () => {
      editorRef.current?.dispose();
    };
  }, [ref.current, key]);

  return (
    <div
      key={key}
      ref={ref}
      style={{ height: '100%' }}
    >

    </div>
  );
}