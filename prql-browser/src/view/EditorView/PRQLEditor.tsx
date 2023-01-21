import { Skeleton } from "@mantine/core";
import Editor, { useMonaco } from "@monaco-editor/react";
import { useEffect, useState } from "react";
import { useSetEditor } from "../../atom/editorAtom";
import { languageId, setupPRQL } from "./prql-vscode";

export interface PRQLEditorProps {
  editorValue: string;
}

export function PRQLEditor(props: PRQLEditorProps) {
  const monaco = useMonaco();
  const [loading, setLoading] = useState(true);
  const setEditor = useSetEditor();

  useEffect(() => {
    if (!monaco) {
      return;
    }

    setupPRQL(monaco);

    setLoading(false);
  }, [monaco]);

  if (loading) {
    return <Skeleton height={50} />;
  }

  return (
    <Editor
      language={languageId}
      defaultValue={props.editorValue}
      onMount={setEditor}
      options={{
        fontSize: 14,
        minimap: { enabled: false },
      }}
    />
  );
}
