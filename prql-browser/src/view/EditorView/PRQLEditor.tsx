import { Session, TableSchema } from "@b4fun/ku-protos";
import { Skeleton } from "@mantine/core";
import Editor, { useMonaco } from "@monaco-editor/react";
import { debounce } from "lodash";
import { MonacoServices } from "monaco-languageclient/.";
import { useEffect, useState } from "react";
import { BrowserMessageReader, BrowserMessageWriter } from 'vscode-languageserver-protocol/browser.js';
import getMessageServiceOverride from 'vscode/service-override/messages';
import { StandaloneServices } from 'vscode/services';
import { useEditorContent, useSetEditor } from "../../atom/editorAtom";
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

export function PRQLEditor(props: PRQLEditorProps) {
  const { editorValue, table, session } = props;
  const monaco = useMonaco();
  const [loading, setLoading] = useState(true);
  const setEditor = useSetEditor();
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

    const worker = new Worker(
      new URL('./sw.ts', window.location.href).href,
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
