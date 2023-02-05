import { InitializeParams, InitializeResult, ServerCapabilities, TextDocuments } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { BrowserMessageReader, BrowserMessageWriter, createConnection, ProposedFeatures } from 'vscode-languageserver/browser.js';

console.log('starting service worker');

// This is an example copied as is from here:
// https://github.com/microsoft/vscode-extension-samples/blob/main/lsp-web-extension-sample/server/src/browserServerMain.ts
// the only addition is the following line:
// declare const self: DedicatedWorkerGlobalScope;

const messageReader = new BrowserMessageReader(self);
const messageWriter = new BrowserMessageWriter(self);

const connection = createConnection(ProposedFeatures.all, messageReader, messageWriter);

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

connection.onCompletion(params => {
  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return;
  }

  const content = document?.getText();
  // console.log(content);
  console.log('on completion')

  return {
    isIncomplete: true,
    items: [
      {
        label: 'test',
      },
      {
        label: 'foo',
      }
    ],
  };
});

// Listen on the connection
connection.listen();