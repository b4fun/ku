import { editor } from "monaco-editor";

export function getEditorLineNumber(
  editorModel: editor.ITextModel,
  lineNumber: number,
  next: (n: number) => number
): number {
  let lastValidLineNumber = lineNumber;
  let nextLineNumber = next(lineNumber);

  const isLineValid = (lineNumber: number) => {
    if (lineNumber < 1 || lineNumber > editorModel.getLineCount()) {
      return false;
    }
    const line = editorModel.getLineContent(lineNumber);
    return !!line.trim();
  };

  if (!isLineValid(lastValidLineNumber)) {
    return lastValidLineNumber;
  }

  while (true) {
    if (!isLineValid(nextLineNumber)) {
      return lastValidLineNumber;
    }

    lastValidLineNumber = nextLineNumber;
    nextLineNumber = next(nextLineNumber);
  }
}

export interface UserInput {
  queryInput: string;
}
