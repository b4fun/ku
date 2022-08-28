import { Monaco } from '@monaco-editor/react';
import { atom, useAtom } from 'jotai';
import { editor } from "monaco-editor";

export type IStandaloneCodeEditor = editor.IStandaloneCodeEditor;

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

export function useSetEditor(): (editor: IStandaloneCodeEditor, monaco: Monaco) => void {
  const [, setEditor] = useAtom(editorAtom);

  return (editor, monaco) => {
    setEditor({
      editor,
      monaco,
      loaded: true,
    });
  }
}

export function useEditorLoaded(): boolean {
  return useAtom(editorAtom)[0].loaded;
}

export function useLoadedEditor(): [LoadedEditorState, true] | [null, false] {
  const [editorValue,] = useAtom(editorAtom);
  if (editorValue.loaded) {
    return [
      { editor: editorValue.editor!, monaco: editorValue.monaco! },
      true,
    ];
  }

  return [null, false];
}