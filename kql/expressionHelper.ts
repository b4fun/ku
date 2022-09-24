import * as kustoHelper from './kustoHelper';
import { Syntax, SyntaxKind } from './kustoHelper';

type KindsFamilyMap = { [key: string]: boolean };

const containsExprFamilyKinds: KindsFamilyMap = {
  [SyntaxKind.ContainsExpression]: true,
  [SyntaxKind.ContainsCsExpression]: true,
  [SyntaxKind.NotContainsExpression]: true,
  [SyntaxKind.NotContainsCsExpression]: true,
};

const supportedContainsExprFamilyKinds: KindsFamilyMap = {
  [SyntaxKind.ContainsExpression]: true,
  [SyntaxKind.NotContainsExpression]: true,
}

const containsExprOpToSqlOp: { [key: string]: string } = {
  [SyntaxKind.ContainsExpression]: 'like',
  [SyntaxKind.NotContainsExpression]: 'not like',
}

export interface whereRaw {
  sql: string;
  bindings?: readonly string[];
}

function containsExpressionToWhereRaw(expr: Syntax.BinaryExpression): whereRaw {
  if (!supportedContainsExprFamilyKinds[expr.Kind]) {
    const op = kustoHelper.kqlToString(expr.Operator).toLowerCase();

    throw new Error(`${op} expression not implemented`);
  }

  const left = kustoHelper.kqlToString(expr.Left);
  // use getTokenValue to unquote string
  const right = kustoHelper.getTokenValue(expr.Right);
  const op = containsExprOpToSqlOp[expr.Kind];

  return {
    sql: `?? ${op} ?`,
    bindings: [left, `%${right}%`],
  };
}

export function expressionToWhereRaw(expr: Syntax.Expression): whereRaw {
  if (containsExprFamilyKinds[expr.Kind]) {
    return containsExpressionToWhereRaw(expr as Syntax.BinaryExpression);
  }

  // defaults to convert the kql to sql literal
  const sql = kustoHelper.kqlToString(expr);
  return {
    sql,
  };
}