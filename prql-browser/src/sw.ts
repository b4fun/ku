import { ColorInformation, ColorPresentation, InitializeParams, InitializeResult, Range, ServerCapabilities, TextDocumentIdentifier, TextDocuments, TextEdit } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { BrowserMessageReader, BrowserMessageWriter, Color, createConnection } from 'vscode-languageserver/browser.js';

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
    colorProvider: {}, // provide a color provider
    completionProvider: {},
    hoverProvider: true,
  };
  return { capabilities };
});

// Track open, change and close text document events
const documents = new TextDocuments(TextDocument);
documents.listen(connection);

// Register providers
connection.onDocumentColor(params => getColorInformation(params.textDocument));
connection.onColorPresentation(params => getColorPresentation(params.color, params.range));

connection.onCompletion(params => {
  console.log(params, 'onCompletion');

  return [];
});

connection.onHover(params => {
  console.log('onHover', params);

  return null;
});

// Listen on the connection
connection.listen();

const colorRegExp = /#([0-9A-Fa-f]{6})/g;

function getColorInformation(textDocument: TextDocumentIdentifier) {
  console.log('color', textDocument);

  const colorInfos: ColorInformation[] = [];

  const document = documents.get(textDocument.uri);
  if (document) {
    const text = document.getText();

    colorRegExp.lastIndex = 0;
    let match;
    while ((match = colorRegExp.exec(text)) != null) {
      const offset = match.index;
      const length = match[0].length;

      const range = Range.create(document.positionAt(offset), document.positionAt(offset + length));
      const color = parseColor(text, offset);
      colorInfos.push({ color, range });
    }
  }

  return colorInfos;
}

function getColorPresentation(color: Color, range: Range) {
  const result: ColorPresentation[] = [];
  const red256 = Math.round(color.red * 255); const green256 = Math.round(color.green * 255); const blue256 = Math.round(color.blue * 255);

  function toTwoDigitHex(n: number): string {
    const r = n.toString(16);
    return r.length !== 2 ? '0' + r : r;
  }

  const label = `#${toTwoDigitHex(red256)}${toTwoDigitHex(green256)}${toTwoDigitHex(blue256)}`;
  result.push({ label, textEdit: TextEdit.replace(range, label) });

  return result;
}

const enum CharCode {
  Digit0 = 48,
  Digit9 = 57,

  A = 65,
  F = 70,

  a = 97,
  f = 102,
}

function parseHexDigit(charCode: CharCode): number {
  if (charCode >= CharCode.Digit0 && charCode <= CharCode.Digit9) {
    return charCode - CharCode.Digit0;
  }
  if (charCode >= CharCode.A && charCode <= CharCode.F) {
    return charCode - CharCode.A + 10;
  }
  if (charCode >= CharCode.a && charCode <= CharCode.f) {
    return charCode - CharCode.a + 10;
  }
  return 0;
}

function parseColor(content: string, offset: number): Color {
  const r = (16 * parseHexDigit(content.charCodeAt(offset + 1)) + parseHexDigit(content.charCodeAt(offset + 2))) / 255;
  const g = (16 * parseHexDigit(content.charCodeAt(offset + 3)) + parseHexDigit(content.charCodeAt(offset + 4))) / 255;
  const b = (16 * parseHexDigit(content.charCodeAt(offset + 5)) + parseHexDigit(content.charCodeAt(offset + 6))) / 255;
  return Color.create(r, g, b, 1);
}