import { toSQL } from "@b4fun/kql";
import { TableColumn, TableSchema, TableValueEncoder } from "@b4fun/ku-protos";
import { Button } from "@mantine/core";
import { Monaco } from "@monaco-editor/react";
import { IconPlayerPlay } from '@tabler/icons';
import { Allotment } from "allotment";
import "allotment/dist/style.css";
import classNames from "classnames";
import { editor } from "monaco-editor";
import React from "react";
import { useLoadedEditor } from "../../atom/editorAtom";
import { grpcClient } from "../../client/api";
import KustoEditor from "./KustoEditor";
import ResultTable from "./ResultTable";
import { ResultTableViewModel, RunQueryViewModel, useResultTableViewModel, useRunQueryAction } from "./viewModel";

interface EditorHeaderProps {
  runQueryViewModel: RunQueryViewModel;
  onRunQuery: () => void;
}

function EditorHeader(props: EditorHeaderProps) {
  const {
    runQueryViewModel,
    onRunQuery,
  } = props;

  const cs = classNames(
    'h-[var(--header-height)]',
    'border-b-[1px] border-[color:var(--border-color-light)]',
    'p-2',
    'text-justify',
  )

  return (
    <div className={cs}>
      <Button
        variant="default"
        size='xs'
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
  editorValue: string;
  resultViewModel: ResultTableViewModel;
}

function EditorBody(props: EditorBodyProps) {
  const {
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
        <ResultTable viewModel={resultViewModel} />
      </Allotment>
    </div>
  );
}

export interface EditorPaneProps {
  table: TableSchema;
  className?: string;
}

const editorDefaultQuery = `
source
| take 100
`.trim()

export default function EditorPane(props: EditorPaneProps) {
  const {
    table,
    className,
  } = props;

  const [resultViewModel, setResultViewModel] = useResultTableViewModel();

  const [editorValue, editorLoaded] = useLoadedEditor();

  if (editorLoaded) {
    setSchema(editorValue.editor, editorValue.monaco)
  }

  const runQueryAction = useRunQueryAction();

  const onRunQuery = () => {
    if (runQueryAction.viewModel.requesting) {
      return;
    }
    if (!editorLoaded) {
      return;
    }

    const queryInput = editorValue.editor.getValue();
    if (!queryInput) {
      console.log('no user input');
      return;
    }

    const query = toSQL(queryInput, { tableName: table.name });

    runQueryAction.setRequesting(true);

    grpcClient().queryTable({ query }).
      then((resp) => {
        const result: ResultTableViewModel = {
          columns: [],
          data: [],
        };

        const tableValueEncoder = new TableValueEncoder(table);

        const tableColumnsByKey: { [key: string]: TableColumn } = {}
        for (let tableColumn of table.columns) {
          result.columns.push({
            title: tableColumn.key,
            dataIndex: tableColumn.key,
            key: tableColumn.key,
          });
          tableColumnsByKey[tableColumn.key] = tableColumn;
        }

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
        runQueryViewModel={runQueryAction.viewModel}
        onRunQuery={onRunQuery}
      />
      <EditorBody
        editorValue={editorDefaultQuery}
        resultViewModel={resultViewModel}
      />
    </div>
  );
}

// TODO: pass in schema
async function setSchema(editor: editor.IStandaloneCodeEditor, monaco: Monaco) {
  const kusto = (monaco.languages as any).kusto as any;
  const workerAccessor = await kusto.getKustoWorker();
  const model = editor.getModel();
  if (!model) {
    throw new Error('no model');
  }
  const worker = await workerAccessor(model.uri);
  worker.setSchemaFromShowSchema(
    {
      Plugins: [
        { Name: 'pivot' },
      ],
      Databases: {
        Ku: {
          Name: 'Ku',
          Tables: {
            source: {
              Name: 'source',
              OrderedColumns: [
                {
                  Name: 'ts',
                  CslType: 'datetime',
                },
                {
                  Name: 'lines',
                  CslType: 'string',
                }
              ],
            },
          },
          Functions: {},
        },
      },
    },
    "https://demo.example.com",
    "Ku",
  );
}