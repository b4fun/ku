import { Session, TableSchema } from "@b4fun/ku-protos";
import { Skeleton } from "@mantine/core";
import Editor, { useMonaco } from "@monaco-editor/react";
import { debounce } from "lodash";
import { useEffect, useState } from "react";
import { useEditorContent, useSetEditor } from "../../atom/editorAtom";
import { sessionHash } from "../../atom/sessionAtom";
import { languageId, setupPRQL } from "./prql-vscode";

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
