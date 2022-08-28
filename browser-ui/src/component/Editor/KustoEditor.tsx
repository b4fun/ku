import { Skeleton } from '@mantine/core';
import Editor, { loader, OnMount, useMonaco } from '@monaco-editor/react';
import { useEffect, useState } from 'react';
import { useSetEditor } from '../../atom/editorAtom';

let promiseResolve: (v: any) => void;
const monacoKustoInitPromise = new Promise((resolve) => {
  promiseResolve = resolve;
});

function loadMonacoKusto() {
  console.log('loading kusto');

  const script = document.createElement('script');
  script.innerHTML = `require(['vs/language/kusto/monaco.contribution'], function() {
    console.log('kusto/monaco loaded');
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

export { type OnMount };

export interface KustoEditorProps {
  editorValue: string;
}

export default function KustoEditor(props: KustoEditorProps) {
  const {
    editorValue,
  } = props;

  const monaco = useMonaco();
  const [loading, setLoading] = useState(true);

  const setEditor = useSetEditor();

  useEffect(() => {
    if (!monaco) {
      return;
    }

    monacoKustoInitPromise.then(() => setLoading(false));
  }, [monaco]);

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
      onMount={setEditor}
    />
  )
}