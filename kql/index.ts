import * as kustoHelper from './kustoHelper';
import { Syntax, SyntaxKind } from './kustoHelper';
import { parsePatternsToRe2, PrimitiveTypeLong, PrimitiveTypeString } from './parseExpressionHelper';
import { DebugSQLOptions, getQueryBuilder, QueryContext, QueryInterface, raw, SQLResult } from "./QueryBuilder";

function toSQLString(v: Syntax.SyntaxElement): string {
  switch (v.Kind) {
    case SyntaxKind.StringLiteralExpression:
    case SyntaxKind.StringLiteralToken:
    case SyntaxKind.CompoundStringLiteralExpression:
      // string literals
      return kustoHelper.getTokenValue(v);
    default:
      return kustoHelper.kqlToString(v);
  }
}

function visitBinaryExpression(
  qc: QueryContext,
  qb: QueryInterface,
  v: Syntax.BinaryExpression,
) {
  // TODO: recursive visit
  const left = toSQLString(v.Left!);
  const right = toSQLString(v.Right!);
  const op = toSQLString(v.Operator!);

  const raw = `${left} ${op} ${right}`;
  qb.whereRaw(raw);
}

function visitContainsExpression(
  qc: QueryContext,
  qb: QueryInterface,
  v: Syntax.BinaryExpression,
) {
  const left = toSQLString(v.Left!);
  const right = toSQLString(v.Right!);
  const op = toSQLString(v.Operator!).toLowerCase();

  switch (op) {
    case 'contains':
      qb.whereLike(left, `%${right}%`);
      break;
    case '!contains':
      qb.not.whereLike(left, `%${right}%`);
      break
    case 'contains_cs':
      throw new Error(`contains_cs not implemented`);
    case '!contains_cs':
      throw new Error(`!contains_cs not implemented`);
  }
}

function visitFilterOperator(
  qc: QueryContext,
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
      visitBinaryExpression(qc, qb, v.Condition as Syntax.BinaryExpression);
      break;
    case SyntaxKind.ContainsExpression:
    case SyntaxKind.ContainsCsExpression:
    case SyntaxKind.NotContainsExpression:
    case SyntaxKind.NotContainsCsExpression:
      visitContainsExpression(qc, qb, v.Condition as Syntax.BinaryExpression);
      break
    default:
      throw new Error(`unsupported condition type ${kustoHelper.getSyntaxKindName(v.Condition.Kind)}`);
  }
}

function visitProjectOperator_SeparatedElement(
  qc: QueryContext,
  qb: QueryInterface,
  v: Syntax.SeparatedElement,
) {
  if (v.ChildCount < 1) {
    return;
  }

  const exprChild = v.GetChild(0); // [Expr] | [Expr, CommaToken]
  switch (exprChild.Kind) {
    case SyntaxKind.NameReference:
      // case: project foo
      qb.select(toSQLString(exprChild));
      break;
    case SyntaxKind.SimpleNamedExpression:
      // case: project a = foo
      {
        const projectAsExpr = (exprChild as Syntax.SimpleNamedExpression);
        const projectAsName = toSQLString(projectAsExpr.Name);
        const projectSource = toSQLString(projectAsExpr.Expression);
        qb.select(raw(`${projectSource} as ${projectAsName}`));
      }
      break;
    default:
      // case: project foo + 10
      {
        const projectSource = toSQLString(exprChild);
        const projectAsName = qc.acquireAutoProjectAsName();
        qb.select(raw(`${projectSource} as ${projectAsName}`));
      }
  }

}

function visitProjectOperator(
  qc: QueryContext,
  qb: QueryInterface,
  v: Syntax.ProjectOperator,
) {
  if (!v.Expressions) {
    return;
  }

  kustoHelper.visitChild(
    v.Expressions,
    (child) => {
      if (child.Kind !== SyntaxKind.SeparatedElement) {
        // unexpected
        return;
      }

      visitProjectOperator_SeparatedElement(
        qc,
        qb,
        child as Syntax.SeparatedElement,
      );
    },
  );
}

function visitSortOperator(
  qc: QueryContext,
  qb: QueryInterface,
  v: Syntax.SortOperator,
) {
  qb.orderByRaw(toSQLString(v.Expressions!));
}

function visitTakeOperator(
  qc: QueryContext,
  qb: QueryInterface,
  v: Syntax.TakeOperator,
) {
  const limitStr = toSQLString(v.Expression);
  const limit = parseInt(limitStr, 10);

  qb.limit(limit);
}

function visitParseOperator(
  qc: QueryContext,
  qb: QueryInterface,
  v: Syntax.ParseOperator,
): QueryInterface {
  const sourceColumn = toSQLString(v.Expression);

  const parseTarget = parsePatternsToRe2(v.Patterns);

  const cteQuery = qb;
  cteQuery.clearSelect();
  parseTarget.virtualColumns.forEach(virtualColumn => {
    const { columnName, primitiveType } = virtualColumn;

    let rawQuery = '';
    rawQuery = `ku_parse(${sourceColumn}, '${parseTarget.regexpPattern}')`;
    rawQuery = `json_extract(${rawQuery}, '$.${columnName}')`;
    switch (primitiveType) {
      case PrimitiveTypeLong:
        rawQuery = `cast(${rawQuery} as integer)`;
        break;
      case PrimitiveTypeString:
        rawQuery = `cast(${rawQuery} as text)`;
        break;
    }

    rawQuery = `${rawQuery} as ${columnName}`;

    cteQuery.select(raw(rawQuery));
  });

  // select all fields from CTE, but after virtual columns as virtual columns
  // take higher precedence.
  cteQuery.select('*');

  const cteTableName = qc.acquireCTETableName();

  qb = getQueryBuilder();
  qb.with(cteTableName, raw(cteQuery.toQuery())).from(cteTableName);

  return qb;
}

function visitCountOperator(
  qc: QueryContext,
  qb: QueryInterface,
  v: Syntax.CountOperator,
): QueryInterface {
  const countOpts: { as: string } = { as: 'Count' };
  if (v.AsIdentifier && v.AsIdentifier.Identifier) {
    countOpts.as = toSQLString(v.AsIdentifier.Identifier);
  }

  const cteQuery = qb;
  cteQuery.count('*', countOpts);
  const cteTableName = qc.acquireCTETableName();

  qb = getQueryBuilder();
  qb.with(cteTableName, raw(cteQuery.toQuery())).from(cteTableName);

  return qb;
}

function visit(
  qc: QueryContext,
  qb: QueryInterface,
  v: Syntax.SyntaxElement,
  indent?: string,
): QueryInterface {
  if (v.Kind === SyntaxKind.EndOfTextToken) {
    // fast path: EOF
    return qb;
  }

  indent = indent || '';

  // kustoHelper.printElement(v, indent);

  switch (v.Kind) {
    case SyntaxKind.FilterOperator:
      visitFilterOperator(qc, qb, v as Syntax.FilterOperator);
      break;
    case SyntaxKind.ProjectOperator:
      visitProjectOperator(qc, qb, v as Syntax.ProjectOperator);
      break;
    case SyntaxKind.SortOperator:
      visitSortOperator(qc, qb, v as Syntax.SortOperator);
      break;
    case SyntaxKind.TakeOperator:
      visitTakeOperator(qc, qb, v as Syntax.TakeOperator);
      break;
    case SyntaxKind.ParseOperator:
      qb = visitParseOperator(qc, qb, v as Syntax.ParseOperator);
      break;
    case SyntaxKind.CountOperator:
      qb = visitCountOperator(qc, qb, v as Syntax.CountOperator);
      break;
    default:
      qc.logUnknown(`unhandled kind: ${kustoHelper.getSyntaxKindName(v.Kind)}`);
      break;
  }

  kustoHelper.visitChild(
    v,
    (child) => {
      qb = visit(qc, qb, child, indent + '  ');
    },
  )

  return qb;
}

const parseKQL = Kusto.Language.KustoCode.Parse;

export interface ToSQLOptions {
  tableName: string;

  debug?: DebugSQLOptions;
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

  const qc = new QueryContext(opts.debug);
  const qb = getQueryBuilder().from(opts.tableName);

  const compiledQB = visit(qc, qb, parsedKQL.Syntax);

  return { sql: compiledQB.toQuery() };
}