import { Session, TableSchema } from "@b4fun/ku-protos";
import { Skeleton } from "@mantine/core";
import Editor, { useMonaco } from "@monaco-editor/react";
import { useEffect, useState } from "react";
import { useSetEditor } from "../../atom/editorAtom";
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

  useEffect(() => {
    if (!monaco) {
      return;
    }

    const uninstallPRQL = setupPRQL(monaco, session, table);

    setLoading(false);

    return uninstallPRQL;
  }, [monaco, sessionHash(session, [table])]);

  if (loading) {
    return <Skeleton height={50} />;
  }

  return (
    <Editor
      language={languageId}
      defaultValue={editorValue}
      onMount={setEditor}
      options={{
        fontSize: 14,
        minimap: { enabled: false },
      }}
    />
  );
}
