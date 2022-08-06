import Editor, { loader, Monaco, useMonaco } from '@monaco-editor/react';
import classNames from 'classnames';
import { editor } from 'monaco-editor';
import React, { useEffect, useRef, useState } from 'react';
import { toSQL } from '../client';
import * as api from '../client/api';

let promiseResolve: (v: any) => void;
const monacoKustoInitPromise = new Promise((resolve) => {
  promiseResolve = resolve;
});

function loadMonacoKusto() {
  console.log('loading');
  const script = document.createElement('script');
  script.innerHTML = `require(['vs/language/kusto/monaco.contribution'], function() {
    console.log('loaded');
    document.dispatchEvent(new Event('kusto_init'));
  });`;
  return document.body.appendChild(script);
}

function onMonacoKustoLoaded() {
  document.removeEventListener('kusto_init', onMonacoKustoLoaded);
  promiseResolve(window);
}

loader.config({
  paths: {
    vs: `/monaco-editor/min/vs`,
  },
});

loader.init().then(() => {
  document.addEventListener('kusto_init', onMonacoKustoLoaded);
  loadMonacoKusto();
});

export interface KustoEditorProps {
  height: number;
}

export default function KustoEditor(props: KustoEditorProps) {
  const { height } = props;

  const monaco = useMonaco();
  const [loading, setLoading] = useState(true);
  const editorRef = useRef<editor.IStandaloneCodeEditor>();

  function getValue() {
    const value = editorRef.current?.getValue();
    if (!value) {
      return;
    }

    console.log(toSQL(value));
  }

  function doQuery() {
    const value = editorRef.current?.getValue();
    if (!value) {
      alert('no query');
      return;
    }

    const query = toSQL(value);

    api.query(query).then((result) => {
      console.log(result);
    })
  }

  useEffect(() => {
    if (!monaco) {
      return;
    }

    monacoKustoInitPromise.then(() => setLoading(false));

  }, [monaco]);

  if (loading) {
    return (<div>loading...</div>);
  }

  return (
    <div style={{ height }}>
      <Editor
        className='mt-1'
        language='kusto'
        defaultValue={`
source
| where ts > ago(10h)
        `.trim()}
        onMount={(editor, monaco) => {
          editorRef.current = editor;

          setSchema(editor, monaco)
            .then(() => {
              console.log('schema set');
            })
            .catch((err) => {
              console.error(err);
            });
        }}
      />
    </div>
  )
}

async function setSchema(editor: editor.IStandaloneCodeEditor, monaco: Monaco) {
  const kusto = (monaco.languages as any).kusto as any;
  const workerAccessor = await kusto.getKustoWorker();
  const model = editor.getModel();
  if (!model) {
    throw new Error('no model');
  }
  const worker = await workerAccessor(model.uri);
  console.log(worker);
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