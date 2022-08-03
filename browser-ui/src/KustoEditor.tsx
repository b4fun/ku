import Editor, { loader, useMonaco } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import React, { useEffect, useRef, useState } from 'react';
import { toSQL } from './client';
import * as api from './client/api';

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

export default function KustoEditor() {
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
    <div>
      <div>
        <a href="#" onClick={() => getValue()}>
          getValue
        </a>
        &nbsp;
        &nbsp;
        &nbsp;
        <a href="#" onClick={() => doQuery()}>
          query
        </a>
      </div>
      <Editor
        height="90vh"
        language='kusto'
        defaultValue={`
source
| where x > 1
        `.trim()}
        onMount={(editor, monaco) => {
          editorRef.current = editor;
        }}
      />
    </div>
  )
}