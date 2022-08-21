import { Allotment } from "allotment";
import classNames from "classnames";
import React, { useRef, useState } from "react";
import KustoEditor, { OnLoad, type OnMount } from "./KustoEditor";
import "allotment/dist/style.css";
import { Button } from "@mantine/core";
import { IconPlayerPlay } from '@tabler/icons';
import { editor } from "monaco-editor";
import { Monaco } from "@monaco-editor/react";
import { QueryTableResponse, TableColumn, TableColumn_Type, TableSchema } from "@b4fun/ku-protos";
import { grpcClient } from "../client/api";
import { toSQL } from "@b4fun/kql";
import KustoResultTable, { newKustoResultTableViewModel, KustoResultTableViewModel } from "./KustoResultTable";

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
  resultViewModel: KustoResultTableViewModel;

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
      <Allotment className="w-full" vertical onChange={(sizes) => {
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
        <div>
          <KustoResultTable viewModel={resultViewModel} />
        </div>
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

  const [resultViewModel, setResultViewModel] = useState<KustoResultTableViewModel>(newKustoResultTableViewModel);

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
        const result: KustoResultTableViewModel = {
          columns: [],
          data: { nodes: [] },
        };

        const tableColumnsByKey: { [key: string]: TableColumn } = {}
        for (let tableColumn of table.columns) {
          result.columns.push({
            label: tableColumn.key,
            renderCell: (item) => item[tableColumn.key],
          });
          tableColumnsByKey[tableColumn.key] = tableColumn;
        }

        result.data.nodes = resp.response.rows.map((row, idx) => {
          return row.columns.reduce((acc, col) => {
            const tableColumn = tableColumnsByKey[col.key];

            switch (tableColumn.type) {
              case TableColumn_Type.BOOL:
                return {
                  ...acc,
                  [tableColumn.key]: col.valueBool,
                };
              case TableColumn_Type.DATE_TIME:
                return {
                  ...acc,
                  [tableColumn.key]: `${col.valueDateTime?.seconds}`,
                };
              case TableColumn_Type.INT64:
                return {
                  ...acc,
                  [tableColumn.key]: col.valueInt64?.value.toString(),
                };
              case TableColumn_Type.REAL:
                return {
                  ...acc,
                  [tableColumn.key]: col.valueReal?.value.toString(),
                };
              case TableColumn_Type.STRING:
                return {
                  ...acc,
                  [tableColumn.key]: col.valueString?.value.toString(),
                };
              default:
                console.log(`unsupported type: ${tableColumn.type}`);
                return {
                  ...acc,
                  [tableColumn.key]: '<parse-failed>',
                };
            }
          }, { id: `${idx}` });
        })

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