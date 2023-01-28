import { Session, TableSchema } from "@b4fun/ku-protos";
import { Monaco } from "@monaco-editor/react";
import { atom, useAtom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import { editor } from "monaco-editor";
import { sessionHash } from "./sessionAtom";

type IStandaloneCodeEditor = editor.IStandaloneCodeEditor;

export interface EditorState {
  editor?: IStandaloneCodeEditor;
  monaco?: Monaco;
  loaded: boolean;
}

export interface LoadedEditorState {
  editor: IStandaloneCodeEditor;
  monaco: Monaco;
}

export const editorAtom = atom<EditorState>({
  loaded: false,
});

export function useSetEditor(): (
  editor: IStandaloneCodeEditor,
  monaco: Monaco
) => void {
  const [, setEditor] = useAtom(editorAtom);

  return (editor, monaco) => {
    setEditor({
      editor,
      monaco,
      loaded: true,
    });
  };
}

export function useEditorLoaded(): boolean {
  return useAtom(editorAtom)[0].loaded;
}

export function useLoadedEditor(): [LoadedEditorState, true] | [null, false] {
  const [editorValue] = useAtom(editorAtom);
  if (editorValue.loaded) {
    return [{ editor: editorValue.editor!, monaco: editorValue.monaco! }, true];
  }

  return [null, false];
}

interface EditorContent {
  key: string;
  value: string;
}

const editorContentStorage = createJSONStorage<EditorContent[]>(
  () => localStorage,
);
const editorContentAtom = atomWithStorage('ku-editor-content', [], editorContentStorage);

export function useEditorContent(
  session: Session,
  table: TableSchema,
): [EditorContent, (value: string) => void] {
  const h = sessionHash(session, [table]);

  const [storage, setStorage] = useAtom(editorContentAtom);
  const editorContent = storage.find((c) => c.key === h) || {
    key: h,
    value: `from ${table.name}`,
  };

  return [
    editorContent,
    (value) => setStorage((prev) => {
      const editorContent = {
        key: h,
        value,
      };
      const index = prev.findIndex((c) => c.key === h);
      if (index === -1) {
        const newValue = [...prev, editorContent];
        if (newValue.length > 5) {
          newValue.shift();
        }
        return newValue;
      }

      return [...prev.slice(0, index), editorContent, ...prev.slice(index + 1)];
    }),
  ];
}