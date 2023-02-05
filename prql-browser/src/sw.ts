import { Session, TableSchema } from '@b4fun/ku-protos';
import { InitializeParams, InitializeResult, ServerCapabilities, TextDocuments } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { BrowserMessageReader, BrowserMessageWriter, createConnection, ProposedFeatures } from 'vscode-languageserver/browser.js';
import { documentUriParamsSessionId, resolveDocumentContext } from './atom/sessionAtom';
import { grpcClient } from './client/api';

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

export interface DocumentContext {
  session: Session;
  tables: TableSchema[];
};

async function resolveDocumentContext(s: string): Promise<DocumentContext> {
  const uri = new URL(decodeURIComponent(s));
  console.log(uri);
  const sessionId = uri.searchParams.get(documentUriParamsSessionId);
  if (!sessionId) {
    throw new Error(`invalid document uri: ${uri}`);
  }

  // TODO: get session api
  const { sessions } = await grpcClient().listSessions({}).response;
  const session = sessions.find(s => s.id === sessionId);
  if (!session) {
    throw new Error(`no session found for id: ${sessionId}`);
  }

  return {
    session,
    tables: session.tables,
  };
}

const documentContextCache: { [uri: string]: DocumentContext } = {};
const documentContextPromises: { [uri: string]: Promise<void> } = {};

connection.onDidOpenTextDocument(params => {
  const documentUri = params.textDocument.uri;
  documentContextPromises[documentUri] = (async () => {
    try {
      documentContextCache[documentUri] = await resolveDocumentContext(documentUri);
    } catch (e) {
      console.log(e);
    }
  })();
});

connection.onCompletion(params => {
  const documentUri = params.textDocument.uri;
  console.log('on completion', documentUri);
  console.log(documents);
  console.log(documents.get(decodeURIComponent(documentUri)));
  const document = documents.get(documentUri);
  if (!document) {
    console.log('no document')
    return;
  }
  const documentContext = documentContextCache[documentUri];
  if (!documentContext) {
    console.log('incomplete');
    return {
      isIncomplete: false,
      items: [],
    };
  }

  console.log('here', documentContext);

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