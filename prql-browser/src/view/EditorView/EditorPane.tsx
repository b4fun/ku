import { TableSchema } from "@b4fun/ku-protos";
import { ResultTable } from "@b4fun/ku-ui";
import { Button } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { IconPlayerPlay } from "@tabler/icons";
import { Allotment } from "allotment";
import { useEffect, useState } from "react";
import { useLoadedEditor } from "../../atom/editorAtom";
import { getEditorLineNumber, UserInput } from "./monaco";
import { PRQLEditor } from "./PRQLEditor";
import useStyles from "./useStyles";
import {
  RunQueryViewModel,
  RunQueryViewModelAction,
  useRunQueryAction,
} from "./viewModel";

interface EditorHeaderProps {
  // editorNavVisible: boolean;
  // showEditorNav: () => void;
  runQueryViewModel: RunQueryViewModel;
  onRunQuery: () => void;
  // onNewParsedTable: () => void;
}

function EditorHeader(props: EditorHeaderProps) {
  const { runQueryViewModel, onRunQuery } = props;
  const { classes } = useStyles();

  return (
    <div className={classes.editorPaneHeader}>
      <Button
        className={classes.editorPaneHeaderButton}
        variant="default"
        size="xs"
        leftIcon={<IconPlayerPlay size={12} />}
        disabled={runQueryViewModel.requesting}
        onClick={onRunQuery}
      >
        Run
      </Button>
    </div>
  );
}

interface EditorBodyProps {
  editorWidth: number;
  editorValue: string;
  runQueryAction: RunQueryViewModelAction;
}

function EditorBody(props: EditorBodyProps) {
  const { classes } = useStyles();
  const { editorWidth, editorValue, runQueryAction } = props;
  const { viewModel: runQueryViewModel } = runQueryAction;
  const { resultViewModel } = runQueryViewModel;

  const [editorHeight, setEditorHeight] = useState(200);

  return (
    <div className={classes.editorPaneBodyWrapper}>
      <Allotment
        className={classes.editorPaneBodyAllotment}
        vertical
        onChange={(sizes) => {
          if (sizes.length === 2) {
            setEditorHeight(sizes[0]);
          }
        }}
      >
        <div style={{ height: editorHeight }}>
          <PRQLEditor editorValue={editorValue} />
        </div>
        <ResultTable viewWidth={editorWidth} viewModel={resultViewModel} />
      </Allotment>
    </div>
  );
}

export interface EditorPaneProps {
  editorWidth: number;
  table: TableSchema;
}

export function EditorPane(props: EditorPaneProps) {
  const { classes } = useStyles();
  const { table, editorWidth } = props;
  const runQueryAction = useRunQueryAction();
  const { viewModel: runQueryViewModel } = runQueryAction;
  const [editorValue, editorLoaded] = useLoadedEditor();

  useEffect(() => {
    if (!editorLoaded) {
      return;
    }

    // TODO: setup table schema
  }, [editorLoaded]);

  const getUserInputInner = (): UserInput => {
    if (!editorLoaded) {
      throw new Error("editor not loaded");
    }

    let queryInput: string;

    const editorModel = editorValue.editor.getModel();
    const selection = editorValue.editor.getSelection();
    if (selection && editorModel) {
      const regionStartLine = getEditorLineNumber(
        editorModel,
        selection.startLineNumber,
        (n) => n - 1
      );
      const regionEndLine = getEditorLineNumber(
        editorModel,
        selection.startLineNumber,
        (n) => n + 1
      );
      queryInput = editorModel.getValueInRange({
        startLineNumber: regionStartLine,
        startColumn: 0,
        endLineNumber: regionEndLine + 1,
        endColumn: 0,
      });
    } else {
      queryInput = editorValue.editor.getValue();
    }

    return {
      queryInput: queryInput.trim(),
    };
  };

  const getUserInput = (): UserInput | undefined => {
    try {
      return getUserInputInner();
    } catch (e) {
      showNotification({
        title: "😱 Query Error",
        message: `${e}`,
        color: "red",
      });
      return;
    }
  };

  const onRunQuery = async () => {
    if (runQueryAction.viewModel.requesting) {
      return;
    }
    if (!editorLoaded) {
      return;
    }

    const userInput = getUserInput();
    if (!userInput) {
      console.error("no valid user input");
      return;
    }

    const { queryInput } = userInput;

    try {
      await runQueryAction.runQuery(queryInput);
    } catch (err) {
      console.error("run query error", err);

      showNotification({
        color: "red",
        title: "😱 Query Error",
        message: `${err}`,
      });
    }
  };

  return (
    <div className={classes.editorPaneWrapper}>
      <EditorHeader
        runQueryViewModel={runQueryViewModel}
        onRunQuery={onRunQuery}
      />
      <EditorBody
        editorWidth={editorWidth}
        editorValue="from raw"
        runQueryAction={runQueryAction}
      />
    </div>
  );
}
