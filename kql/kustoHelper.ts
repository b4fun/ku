/// <reference path="../node_modules/@kusto/language-service-next/bridge.d.ts" />
/// <reference path="../node_modules/@kusto/language-service-next/Kusto.Language.Bridge.d.ts" />

if (typeof document === 'undefined') {
  // non-browser environment, import the script
  require('@kusto/language-service-next/bridge');
  require('@kusto/language-service-next/Kusto.Language.Bridge');
}

import SyntaxKind = Kusto.Language.Syntax.SyntaxKind;
import Syntax = Kusto.Language.Syntax;

export { SyntaxKind, Syntax };

export function getEnumKeyByEnumValue<
  TEnumKey extends string,
  TEnumVal extends string | number
>(myEnum: { [key in TEnumKey]: TEnumVal }, enumValue: TEnumVal): string {
  const keys = (Object.keys(myEnum) as TEnumKey[]).filter(
    (x) => myEnum[x] === enumValue,
  );
  return keys.length > 0 ? keys[0] : '';
}

export function getSyntaxKindName(v: number): string {
  return getEnumKeyByEnumValue(SyntaxKind, v);
}

export function printElement(v: Syntax.SyntaxElement, indent: string) {
  if (v.IsToken) {
    const ps = [
      indent + getSyntaxKindName(v.Kind),
    ];

    v.WalkTokens((token) => {
      ps.push(`${token.Text}`);
    });

    console.log(ps.join(' '));
  } else {
    console.log(indent + getSyntaxKindName(v.Kind));
  }
}

export function kqlToString(v: Syntax.SyntaxElement): string {
  return v.ToString(Syntax.IncludeTrivia.Minimal) || '';
}

export function getTokenValue(v: Syntax.SyntaxElement): string {
  const values: string[] = [];
  v.WalkTokens(t => {
    if (t.ValueText) {
      values.push(t.ValueText);
    }
  });

  return values.join('');
}