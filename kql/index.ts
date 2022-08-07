/// <reference path="../node_modules/@kusto/language-service-next/bridge.d.ts" />
/// <reference path="../node_modules/@kusto/language-service-next/Kusto.Language.Bridge.d.ts" />
import QueryInterface, { QueryBuilder, SQLResult } from "./QueryBuilder";
export { SQLResult } from './QueryBuilder';

if (typeof document === 'undefined') {
  // non-browser environment, import the script
  require('@kusto/language-service-next/bridge');
  require('@kusto/language-service-next/Kusto.Language.Bridge');
}

import SyntaxKind = Kusto.Language.Syntax.SyntaxKind;
import Syntax = Kusto.Language.Syntax;

function getEnumKeyByEnumValue<
  TEnumKey extends string,
  TEnumVal extends string | number
>(myEnum: { [key in TEnumKey]: TEnumVal }, enumValue: TEnumVal): string {
  const keys = (Object.keys(myEnum) as TEnumKey[]).filter(
    (x) => myEnum[x] === enumValue,
  );
  return keys.length > 0 ? keys[0] : '';
}

function getSyntaxKindName(v: number): string {
  return getEnumKeyByEnumValue(SyntaxKind, v);
}

function printElement(v: Syntax.SyntaxElement, indent: string) {
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

function toSQLString(v: Syntax.SyntaxElement): string {
  switch (v.Kind) {
    case SyntaxKind.StringLiteralExpression:
    case SyntaxKind.StringLiteralToken:
    case SyntaxKind.CompoundStringLiteralExpression:
      // string literals
      return getTokenValue(v);
    default:
      return v.ToString(Syntax.IncludeTrivia.Minimal) || '';
  }
}

function getTokenValue(v: Syntax.SyntaxElement): string {
  const values: string[] = [];
  v.WalkTokens(t => {
    if (t.ValueText) {
      values.push(t.ValueText);
    }
  });

  return values.join('');
}

function visitBinaryExpression(
  qb: QueryInterface,
  v: Syntax.BinaryExpression,
) {
  // TODO: recursive visit
  const left = toSQLString(v.Left!);
  const right = toSQLString(v.Right!);
  const op = toSQLString(v.Operator!);

  const raw = `${left} ${op} ${right}`;
  qb.andWhereRaw(raw);
}

function visitContainsExpression(
  qb: QueryInterface,
  v: Syntax.BinaryExpression,
) {
  const left = toSQLString(v.Left!);
  const right = toSQLString(v.Right!);
  const op = toSQLString(v.Operator!).toLowerCase();

  let raw: string;

  switch (op) {
    case 'contains':
      raw = `${left} LIKE '%${right}%'`;
      qb.andWhereRaw(raw);
      break;
    case '!contains':
      raw = `${left} NOT LIKE '%${right}%'`;
      qb.andWhereRaw(raw);
      break
    case 'contains_cs':
      throw new Error(`contains_cs not implemented`);
    case '!contains_cs':
      throw new Error(`!contains_cs not implemented`);
  }
}

function visitFilterOperator(
  qb: QueryInterface,
  v: Syntax.FilterOperator,
) {
  if (!v.Condition) {
    throw new Error(`missing condition`);
  }

  switch (v.Condition.Kind) {
    case SyntaxKind.AndExpression:
    case SyntaxKind.OrExpression:
    case SyntaxKind.GreaterThanExpression:
    case SyntaxKind.GreaterThanOrEqualExpression:
    case SyntaxKind.LessThanExpression:
    case SyntaxKind.LessThanOrEqualExpression:
    case SyntaxKind.NotEqualExpression:
      visitBinaryExpression(qb, v.Condition as Syntax.BinaryExpression);
      break;
    case SyntaxKind.ContainsExpression:
    case SyntaxKind.ContainsCsExpression:
    case SyntaxKind.NotContainsExpression:
    case SyntaxKind.NotContainsCsExpression:
      visitContainsExpression(qb, v.Condition as Syntax.BinaryExpression);
      break
    default:
      throw new Error(`unsupported condition type ${getSyntaxKindName(v.Condition.Kind)}`);
  }
}

function visitProjectOperator(
  qb: QueryInterface,
  v: Syntax.ProjectOperator,
) {
  v.Expressions?.WalkNodes((node) => {
    if (node.Kind === SyntaxKind.NameReference) {
      qb.select(toSQLString(node));
    }
  });
}

function visitSortOperator(
  qb: QueryInterface,
  v: Syntax.SortOperator,
) {
  qb.orderByRaw(toSQLString(v.Expressions!));
}

function visit(
  qb: QueryInterface,
  v: Syntax.SyntaxElement,
  indent?: string,
) {
  indent = indent || '';

  // printElement(v, indent);

  switch (v.Kind) {
    case SyntaxKind.FilterOperator:
      visitFilterOperator(qb, v as Syntax.FilterOperator);
      break;
    case SyntaxKind.ProjectOperator:
      visitProjectOperator(qb, v as Syntax.ProjectOperator);
      break;
    case SyntaxKind.SortOperator:
      visitSortOperator(qb, v as Syntax.SortOperator);
      break;
  }

  for (let idx = 0; idx < v.ChildCount; idx++) {
    const child = v.GetChild(idx);
    if (!child) {
      continue;
    }
    visit(qb, child, indent + '.');
  }
}

const parseKQL = Kusto.Language.KustoCode.Parse;

export interface ToSQLOptions {
  tableName: string;
}

function defaultToSQLOptions(): ToSQLOptions {
  return {
    tableName: 'source',
  };
}

export function toSQL(kql: string, opts?: ToSQLOptions): SQLResult {
  if (!opts) {
    opts = defaultToSQLOptions();
  } else {
    opts = { ...defaultToSQLOptions(), ...opts };
  }

  const parsedKQL = parseKQL(kql);
  if (!parsedKQL?.Syntax) {
    throw new Error(`failed to parse input KQL`);
  }

  const qb = new QueryBuilder().from(opts.tableName);

  visit(qb, parsedKQL.Syntax);

  return qb.toSQL();
}