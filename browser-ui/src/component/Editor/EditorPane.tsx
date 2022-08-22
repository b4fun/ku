import { toSQL } from "@b4fun/kql";
import { QueryTableResponse, TableColumn, TableSchema, TableValueEncoder } from "@b4fun/ku-protos";
import { Button } from "@mantine/core";
import { Monaco } from "@monaco-editor/react";
import { IconPlayerPlay } from '@tabler/icons';
import { Allotment } from "allotment";
import "allotment/dist/style.css";
import classNames from "classnames";
import { editor } from "monaco-editor";
import React, { useRef, useState } from "react";

import { grpcClient } from "../../client/api";
import KustoEditor, { OnLoad, type OnMount } from "./KustoEditor";
import ResultTable, { newResultTableViewModel, ResultTableViewModel } from "./ResultTable";

// TODO:
// 1. merge view models & unify loading states
// 2. decouple editor ref?
// 3. move selected table to global state / atom

interface RunQueryViewModel {
  isRunning: boolean;
  response?: QueryTableResponse;
}

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
        disabled={runQueryViewModel.isRunning}
        onClick={onRunQuery}
      >
        Run
      </Button>
    </div>
  );
}

interface EditorBodyProps {
  defaultValue: string;
  resultViewModel: ResultTableViewModel;

  onLoad?: OnLoad;
  onMount: OnMount;
}

function EditorBody(props: EditorBodyProps) {
  const {
    onMount,
    onLoad,
    defaultValue,
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
        <KustoEditor
          height={editorHeight}
          defaultValue={defaultValue}
          onMount={onMount}
          onLoad={onLoad}
        />
        <ResultTable viewModel={resultViewModel} />
      </Allotment>
    </div>
  );
}

export interface EditorPaneProps {
  table: TableSchema;
  className?: string;
  onLoad?: OnLoad;
}

const editorDefaultQuery = `
source
| take 100
`.trim()

export default function EditorPane(props: EditorPaneProps) {
  const {
    table,
    className,
    onLoad,
  } = props;

  const [resultViewModel, setResultViewModel] = useState<ResultTableViewModel>(newResultTableViewModel);

  const editorRef = useRef<editor.IStandaloneCodeEditor>();

  const mountEditor = (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    console.log('editor loaded');

    editorRef.current = editor;
    setSchema(editor, monaco);
  };

  const [runQueryViewModel, setRunQueryViewModel] = useState<RunQueryViewModel>({
    isRunning: false,
  });

  const onRunQuery = () => {
    if (runQueryViewModel.isRunning) {
      return;
    }

    const queryInput = editorRef.current?.getValue();
    if (!queryInput) {
      console.log('no user input');
      return;
    }

    const query = toSQL(queryInput, { tableName: table.name });

    setRunQueryViewModel({
      ...runQueryViewModel,
      isRunning: true,
    })

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

        setRunQueryViewModel({
          ...runQueryViewModel,
          isRunning: false,
        });

        setResultViewModel(result);
      }).
      catch((err) => {
        console.error(err);

        setRunQueryViewModel({
          ...runQueryViewModel,
          isRunning: false,
        });
      });
  };

  const cs = classNames(
    'flex flex-col',
    className,
  )

  return (
    <div className={cs}>
      <EditorHeader
        runQueryViewModel={runQueryViewModel}
        onRunQuery={onRunQuery}
      />
      <EditorBody
        defaultValue={editorDefaultQuery}
        resultViewModel={resultViewModel}
        onMount={mountEditor}
        onLoad={onLoad}
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