import { Allotment } from "allotment";
import classNames from "classnames";
import React, { useEffect, useRef, useState } from "react";
import KustoEditor, { OnLoad, type OnMount } from "./KustoEditor";
import "allotment/dist/style.css";
import { Button } from "@mantine/core";
import { IconPlayerPlay } from '@tabler/icons';
import { editor } from "monaco-editor";
import { Monaco } from "@monaco-editor/react";
import { QueryTableResponse } from "@b4fun/ku-protos";
import { grpcClient } from "../client/api";
import { toSQL } from "@b4fun/kql";

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

  onLoad?: OnLoad;
  onMount: OnMount;
}

function EditorBody(props: EditorBodyProps) {
  const {
    onMount,
    onLoad,
    defaultValue,
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
        <div>foobar</div>
      </Allotment>
    </div>
  );
}

export interface EditorPaneProps {
  tableName: string;
  className?: string;
  onLoad?: OnLoad;
}

const editorDefaultQuery = `
source
| take 100
`.trim()

export default function EditorPane(props: EditorPaneProps) {
  const {
    tableName,
    className,
    onLoad,
  } = props;

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

    const query = toSQL(queryInput, { tableName });

    setRunQueryViewModel({
      ...runQueryViewModel,
      isRunning: true,
    })

    grpcClient().queryTable({ query }).
      then((resp) => {
        resp.response.rows.forEach(row => {
          row.columns.forEach(col => {
            console.log(col);
          })
          console.log('====');
        })

        setRunQueryViewModel({
          ...runQueryViewModel,
          isRunning: false,
        });
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