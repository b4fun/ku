import { toSQL } from "@b4fun/kql";
import { Session, TableSchema, TableValueEncoder } from "@b4fun/ku-protos";
import { Button } from "@mantine/core";
import { Monaco } from "@monaco-editor/react";
import { IconLayoutSidebarRightCollapse, IconPlayerPlay, IconTransform } from '@tabler/icons';
import { Allotment } from "allotment";
import classNames from "classnames";
import { editor } from "monaco-editor";
import React, { useEffect } from "react";
import { useLoadedEditor } from "../../atom/editorAtom";
import { sessionHash } from "../../atom/sessionAtom";
import { grpcClient } from "../../client/api";
import NewParsedTableDrawer, { useNewParsedTableDrawerAction } from "../NewParsedTableDrawer";
import { sessionToKustoSchema } from "./kusto";
import KustoEditor from "./KustoEditor";
import ResultTable from "./ResultTable";
import { ResultTableViewModel, RunQueryViewModel, useResultTableViewModel, useRunQueryAction } from "./viewModel";

interface EditorHeaderProps {
  editorNavVisible: boolean;
  showEditorNav: () => void;

  runQueryViewModel: RunQueryViewModel;
  onRunQuery: () => void;
  onNewParsedTable: () => void;
}

function EditorHeader(props: EditorHeaderProps) {
  const {
    editorNavVisible,
    showEditorNav,
    runQueryViewModel,
    onRunQuery,
    onNewParsedTable,
  } = props;

  const cs = classNames(
    'h-[var(--header-height)]',
    'border-b-[1px] border-[color:var(--border-color-light)]',
    'p-2',
    'text-justify',
  );

  const buttonClassName = 'mr-2'

  // need to run at least 1 time before creating table from current query
  const canNewTable = !runQueryViewModel.requesting && !!runQueryViewModel.response;

  let toggleNavBar: React.ReactNode;
  if (!editorNavVisible) {
    toggleNavBar = (
      <Button
        className={buttonClassName}
        variant="default"
        size='xs'
        disabled={runQueryViewModel.requesting}
        title="Show sidebar"
        onClick={showEditorNav}
      >
        <IconLayoutSidebarRightCollapse size={12} />
      </Button>
    );
  }

  return (
    <div className={cs}>
      {toggleNavBar}

      <Button
        className={buttonClassName}
        variant="default"
        size='xs'
        leftIcon={<IconPlayerPlay size={12} />}
        disabled={runQueryViewModel.requesting}
        onClick={onRunQuery}
      >
        Run
      </Button>

      <Button
        className={buttonClassName}
        variant="default"
        size='xs'
        leftIcon={<IconTransform size={12} />}
        disabled={!canNewTable}
        title="New table from current query"
        onClick={onNewParsedTable}
      >
        New
      </Button>
    </div>
  );
}

interface EditorBodyProps {
  editorWidth: number;
  editorValue: string;
  resultViewModel: ResultTableViewModel;
}

function EditorBody(props: EditorBodyProps) {
  const {
    editorWidth,
    editorValue,
    resultViewModel,
  } = props;

  const [editorHeight, setEditorHeight] = React.useState(200);

  return (
    <div className="flex-1">
      <Allotment className="w-full flex" vertical onChange={(sizes) => {
        if (sizes.length === 2) {
          setEditorHeight(sizes[0]);
        }
      }}>
        <div style={{ height: editorHeight }}>
          <KustoEditor
            editorValue={editorValue}
          />
        </div>
        <ResultTable viewWidth={editorWidth} viewModel={resultViewModel} />
      </Allotment>
    </div>
  );
}

export interface EditorPaneProps {
  table: TableSchema;
  session: Session;
  className?: string;

  editorWidth: number;
  editorNavVisible: boolean;
  showEditorNav: () => void;
}

const editorDefaultQuery = `
raw
| take 100
`.trim()

function getEditorLineNumber(
  editorModel: editor.ITextModel,
  startLine: number,
  nextLine: (n: number) => number,
  pred: (s: string) => boolean,
): number {
  const maxLine = editorModel.getLineCount();

  let line = startLine;
  let lineText = editorModel.getLineContent(line);
  while (pred(lineText)) {
    line = nextLine(line);
    if (line > maxLine || line < 1) {
      break;
    }
    lineText = editorModel.getLineContent(line);
  }
  return line;
}

export default function EditorPane(props: EditorPaneProps) {
  const {
    table,
    session,
    className,
    editorWidth,
    editorNavVisible,
    showEditorNav,
  } = props;

  const [resultViewModel, setResultViewModel] = useResultTableViewModel();

  const [editorValue, editorLoaded] = useLoadedEditor();

  useEffect(
    () => {
      if (!editorLoaded) {
        return;
      }

      setSchemas(editorValue.editor, editorValue.monaco, session, table);
    },
    [editorLoaded, sessionHash(session, [table])],
  );

  const runQueryAction = useRunQueryAction();
  const newParsedTableDrawerAction = useNewParsedTableDrawerAction();

  const getUserInput = (): { queryInput: string; sql: string; } | undefined => {
    if (!editorLoaded) {
      return;
    }

    let queryInput: string;

    const editorModel = editorValue.editor.getModel();
    const selection = editorValue.editor.getSelection();
    if (selection && editorModel) {
      {
        const regionStartLine = getEditorLineNumber(
          editorModel,
          selection.startLineNumber,
          (n) => n - 1,
          (l) => !!l.trim(),
        );
        const regionEndLine = getEditorLineNumber(
          editorModel,
          selection.startLineNumber,
          (n) => n + 1,
          (l) => !!l.trim(),
        );
        queryInput = editorModel.getValueInRange({
          startLineNumber: regionStartLine,
          startColumn: 0,
          endLineNumber: regionEndLine + 1,
          endColumn: 0,
        });
      }
    } else {
      queryInput = editorValue.editor.getValue();
    }

    queryInput = queryInput.trim();

    const query = toSQL(queryInput, { tableName: table.id });

    return {
      queryInput,
      sql: query.sql,
    };
  };

  const onRunQuery = () => {
    if (runQueryAction.viewModel.requesting) {
      return;
    }
    if (!editorLoaded) {
      return;
    }

    const userInput = getUserInput();

    if (!userInput) {
      console.error('no valid user input');
      return;
    }

    const { queryInput, sql } = userInput;

    console.log(`raw query input: ${queryInput}`);
    console.log(`querying ${sql}`);

    runQueryAction.setRequesting(true);

    grpcClient().queryTable({ sql }).
      then((resp) => {
        const result: ResultTableViewModel = {
          columns: [],
          data: [],
        };

        result.columns = resp.response.columns.map((columnSchema) => ({
          title: columnSchema.key,
          dataIndex: columnSchema.key,
          key: columnSchema.key,
        }));
        const tableValueEncoder = new TableValueEncoder(resp.response.columns);

        console.log('rows', resp.response.rows);
        console.log('columns', resp.response.columns);
        result.data = resp.response.rows.map((row, idx) => {
          const rowData = tableValueEncoder.encodeRow(row);
          rowData.key = `${idx}`;

          return rowData;
        });

        runQueryAction.setResponse(resp.response);

        setResultViewModel(result);
      }).
      catch((err) => {
        console.error(err);

        runQueryAction.setRequesting(false);
      });
  };

  const cs = classNames(
    'flex flex-col',
    className,
  )

  return (
    <div className={cs}>
      <EditorHeader
        editorNavVisible={editorNavVisible}
        showEditorNav={showEditorNav}
        runQueryViewModel={runQueryAction.viewModel}
        onRunQuery={onRunQuery}
        onNewParsedTable={() => {
          const userInput = getUserInput();
          if (!userInput) {
            console.error('no valid user input');
            return;
          }

          newParsedTableDrawerAction.showDrawer({
            session,
            sql: userInput.sql,
            queryInput: userInput.queryInput,
          });
        }}
      />
      <EditorBody
        editorWidth={editorWidth}
        editorValue={editorDefaultQuery}
        resultViewModel={resultViewModel}
      />
      <NewParsedTableDrawer
        viewModelAction={newParsedTableDrawerAction}
      />
    </div>
  );
}

async function setSchemas(
  editor: editor.IStandaloneCodeEditor,
  monaco: Monaco,
  session: Session,
  table: TableSchema,
) {
  const kusto = (monaco.languages as any).kusto as any;
  const workerAccessor = await kusto.getKustoWorker();
  const model = editor.getModel();
  if (!model) {
    throw new Error('no model');
  }
  const worker = await workerAccessor(model.uri);

  const kustoSessionDatabaseSchema = sessionToKustoSchema(session, [table]);

  await worker.setSchemaFromShowSchema(
    {
      Plugins: [
        { Name: 'pivot' },
      ],
      Databases: {
        [kustoSessionDatabaseSchema.Name]: kustoSessionDatabaseSchema,
      },
    },
    "https://demo.example.com",
    kustoSessionDatabaseSchema.Name,
  );
}