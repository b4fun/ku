import { TableSchema } from "@b4fun/ku-protos";
import { ResultTable } from "@b4fun/ku-ui";
import { Button } from "@mantine/core";
import { IconPlayerPlay } from "@tabler/icons";
import { Allotment } from "allotment";
import { useState } from "react";
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
        <div style={{ height: editorHeight }}></div>
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

  return (
    <div className={classes.editorPaneWrapper}>
      <EditorHeader
        runQueryViewModel={runQueryViewModel}
        onRunQuery={() => {
          runQueryAction.runQuery(`from ${table.id}`);
        }}
      />
      <EditorBody
        editorWidth={editorWidth}
        editorValue="from raw"
        runQueryAction={runQueryAction}
      />
    </div>
  );
}
