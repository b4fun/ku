import { InitializeParams, InitializeResult, ServerCapabilities, TextDocuments } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { BrowserMessageReader, BrowserMessageWriter, createConnection } from 'vscode-languageserver/browser.js';

console.log('starting service worker');

// This is an example copied as is from here:
// https://github.com/microsoft/vscode-extension-samples/blob/main/lsp-web-extension-sample/server/src/browserServerMain.ts
// the only addition is the following line:
// declare const self: DedicatedWorkerGlobalScope;

const messageReader = new BrowserMessageReader(self);
const messageWriter = new BrowserMessageWriter(self);

const connection = createConnection(messageReader, messageWriter);

/* from here on, all code is non-browser specific and could be shared with a regular extension */

connection.onInitialize((_params: InitializeParams): InitializeResult => {
  const capabilities: ServerCapabilities = {
    completionProvider: {},
  };
  return { capabilities };
});

// Track open, change and close text document events
const documents = new TextDocuments(TextDocument);
documents.listen(connection);

// Register providers
connection.onCompletion(params => {
  console.log('onCompletion');
  console.log(params.position);
  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return;
  }

  const content = document?.getText({
    start: {
      ...params.position,
      character: 0,
    },
    end: {
      ...params.position,
      character: params.position.character + 1,
    },
  });
  console.log(content);

  return [];
});

// Listen on the connection
connection.listen();