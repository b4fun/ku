import * as kustoHelper from './kustoHelper';
import { Syntax, SyntaxKind } from './kustoHelper';
import { parsePatternsToRe2, PrimitiveTypeLong, PrimitiveTypeString, unescapeRegexPlaceholders } from './parseExpressionHelper';
import { DebugSQLOptions, getQueryBuilder, QueryContext, QueryInterface, raw, SQLResult } from "./QueryBuilder";

function visitBinaryExpression(
  qc: QueryContext,
  qb: QueryInterface,
  v: Syntax.BinaryExpression,
) {
  // TODO: recursive visit
  const left = kustoHelper.kqlToString(v.Left!);
  const right = kustoHelper.kqlToString(v.Right!);
  const op = kustoHelper.kqlToString(v.Operator!);

  const raw = `${left} ${op} ${right}`;
  qb.whereRaw(raw);
}

function visitContainsExpression(
  qc: QueryContext,
  qb: QueryInterface,
  v: Syntax.BinaryExpression,
) {
  const left = kustoHelper.kqlToString(v.Left!);
  // use getTokenValue to unquote string
  const right = kustoHelper.getTokenValue(v.Right!);
  const op = kustoHelper.kqlToString(v.Operator!).toLowerCase();

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
    case SyntaxKind.EqualExpression:
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
      qb.select(kustoHelper.kqlToString(exprChild));
      break;
    case SyntaxKind.SimpleNamedExpression:
      // case: project a = foo
      {
        const projectAsExpr = (exprChild as Syntax.SimpleNamedExpression);
        const projectAsName = kustoHelper.kqlToString(projectAsExpr.Name);
        const projectSource = kustoHelper.kqlToString(projectAsExpr.Expression);
        qb.select(raw(`${projectSource} as ${projectAsName}`));
      }
      break;
    default:
      // case: project foo + 10
      {
        const projectSource = kustoHelper.kqlToString(exprChild);
        const projectAsName = qc.acquireAutoProjectAsName();
        qb.select(raw(`${projectSource} as ${projectAsName}`));
      }
  }

}

function visitProjectOperator(
  qc: QueryContext,
  qb: QueryInterface,
  v: Syntax.ProjectOperator,
): QueryInterface {
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

  return qc.wrapAsCTE(qb);
}

function visitSortOperator(
  qc: QueryContext,
  qb: QueryInterface,
  v: Syntax.SortOperator,
) {
  qb.orderByRaw(kustoHelper.kqlToString(v.Expressions!));
}

function visitTakeOperator(
  qc: QueryContext,
  qb: QueryInterface,
  v: Syntax.TakeOperator,
) {
  const limitStr = kustoHelper.kqlToString(v.Expression);
  const limit = parseInt(limitStr, 10);

  qb.limit(limit);
}

function visitParseOperator(
  qc: QueryContext,
  qb: QueryInterface,
  v: Syntax.ParseOperator,
): QueryInterface {
  const sourceColumn = kustoHelper.kqlToString(v.Expression);

  const parseTarget = parsePatternsToRe2(v.Patterns);

  qb.clearSelect();
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

    qb.select(raw(rawQuery));
  });

  // select all fields from CTE, but after virtual columns as virtual columns
  // take higher precedence.
  qb.select('*');

  return qc.wrapAsCTE(qb);
}

function visitCountOperator(
  qc: QueryContext,
  qb: QueryInterface,
  v: Syntax.CountOperator,
): QueryInterface {
  const countOpts: { as: string } = { as: 'Count' };
  if (v.AsIdentifier && v.AsIdentifier.Identifier) {
    countOpts.as = kustoHelper.kqlToString(v.AsIdentifier.Identifier);
  }

  qb.count('*', countOpts);

  return qc.wrapAsCTE(qb);
}

function visitDistinctOperator(
  qc: QueryContext,
  qb: QueryInterface,
  v: Syntax.DistinctOperator,
): QueryInterface {
  if (!v.Expressions) {
    return;
  }

  const distinctColumns = [];
  kustoHelper.visitChild(
    v.Expressions,
    (child) => {
      if (child.Kind !== SyntaxKind.SeparatedElement) {
        // unexpected
        return;
      }

      kustoHelper.visitChild(
        child,
        (childValue) => {
          if (childValue.Kind !== SyntaxKind.NameReference) {
            // unexpected
            return;
          }

          const columnName = kustoHelper.kqlToString(childValue);
          distinctColumns.push(columnName);
        },
      );
    },
  );

  qb.distinct(...distinctColumns);

  return qc.wrapAsCTE(qb);
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
      qb = visitProjectOperator(qc, qb, v as Syntax.ProjectOperator);
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
    case SyntaxKind.DistinctOperator:
      qb = visitDistinctOperator(qc, qb, v as Syntax.DistinctOperator);
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

  // FIXME: start from query block instead of recursively visiting all children
  const compiledQB = visit(qc, qb, parsedKQL.Syntax);

  let sql = compiledQB.toQuery();
  sql = unescapeRegexPlaceholders(sql);

  return { sql };
}