import { Skeleton } from '@mantine/core';
import Editor, { loader, OnMount, useMonaco } from '@monaco-editor/react';
import { useEffect, useState } from 'react';

let promiseResolve: (v: any) => void;
const monacoKustoInitPromise = new Promise((resolve) => {
  promiseResolve = resolve;
});

function loadMonacoKusto() {
  console.log('loading kusto');

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

export type OnLoad = (loaded: boolean) => void;
export { type OnMount };

export interface KustoEditorProps {
  editorValue: string;

  onLoad?: OnLoad;
  onMount?: OnMount;
}

export default function KustoEditor(props: KustoEditorProps) {
  const {
    editorValue,
    onMount,
    onLoad,
  } = props;

  const monaco = useMonaco();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!monaco) {
      return;
    }

    monacoKustoInitPromise.then(() => setLoading(false));
  }, [monaco]);

  useEffect(() => {
    if (onLoad) {
      onLoad(!loading);
    }
  }, [loading]);

  if (loading) {
    return (
      <Skeleton height={50} />
    );
  }

  return (
    <Editor
      className='mt-1'
      language='kusto'
      defaultValue={editorValue}
      onMount={onMount}
    />
  )
}