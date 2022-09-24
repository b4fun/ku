import { expressionToWhereRaw } from './expressionHelper';
import * as kustoHelper from './kustoHelper';
import { Syntax, SyntaxKind } from './kustoHelper';
import { parsePatternsToRe2, PrimitiveTypeLong, PrimitiveTypeString, unescapeRegexPlaceholders } from './parseExpressionHelper';
import { DebugSQLOptions, getQueryBuilder, QueryContext, QueryInterface, raw, SQLResult } from "./QueryBuilder";

function visitFilterOperator(
  qc: QueryContext,
  qb: QueryInterface,
  v: Syntax.FilterOperator,
) {
  if (!v.Condition) {
    throw new Error(`missing condition`);
  }

  const whereRaw = expressionToWhereRaw(v.Condition);
  qb.whereRaw(whereRaw.sql, whereRaw.bindings);
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
        const projectSource = expressionToWhereRaw(projectAsExpr.Expression);
        const projectAsName = kustoHelper.kqlToString(projectAsExpr.Name);
        qb.select(raw(`${projectSource.sql} as ${projectAsName}`, projectSource.bindings));
      }
      break;
    default:
      // case: project foo + 10
      {
        const projectSource = expressionToWhereRaw(exprChild as Syntax.Expression);
        const projectAsName = qc.acquireAutoProjectAsName();
        qb.select(raw(`${projectSource.sql} as ${projectAsName}`, projectSource.bindings));
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

function visitExtendOperator(
  qc: QueryContext,
  qb: QueryInterface,
  v: Syntax.ExtendOperator,
): QueryInterface {
  if (!v.Expressions) {
    return qb;
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
    }
  );

  // select all fields from CTE, but after extended columns as extended columns
  // take higher precedence.
  qb.select('*');

  return qc.wrapAsCTE(qb);
}

function visitQueryBlock(
  qc: QueryContext,
  qb: QueryInterface,
  v: Syntax.QueryBlock,
): QueryInterface {
  kustoHelper.visitChild(
    v.Statements,
    (separatedElement) => {
      if (separatedElement.Kind !== SyntaxKind.SeparatedElement) {
        // unexpected
        return;
      }

      const child = (separatedElement as Syntax.SeparatedElement).Element;
      qb = visit(qc, qb, child);
    },
  );

  return qb;
}

function visitPipeExpression(
  qc: QueryContext,
  qb: QueryInterface,
  v: Syntax.PipeExpression,
): QueryInterface {
  const expr = v.Expression;
  if (expr.Kind !== SyntaxKind.NameReference) {
    // skip `source | <...>`
    qb = visit(qc, qb, expr);
  }

  qb = visit(qc, qb, v.Operator);

  return qb;
}

function visit(
  qc: QueryContext,
  qb: QueryInterface,
  v: Syntax.SyntaxElement,
): QueryInterface {
  switch (v.Kind) {
    case SyntaxKind.EndOfTextToken:
      return qb;
    case SyntaxKind.QueryBlock:
      return visitQueryBlock(qc, qb, v as Syntax.QueryBlock);
    case SyntaxKind.ExpressionStatement:
      return visit(qc, qb, (v as Syntax.ExpressionStatement).Expression);
    case SyntaxKind.PipeExpression:
      return visitPipeExpression(qc, qb, v as Syntax.PipeExpression);
    case SyntaxKind.FilterOperator:
      visitFilterOperator(qc, qb, v as Syntax.FilterOperator);
      return qb;
    case SyntaxKind.ProjectOperator:
      return visitProjectOperator(qc, qb, v as Syntax.ProjectOperator);
    case SyntaxKind.SortOperator:
      visitSortOperator(qc, qb, v as Syntax.SortOperator);
      return qb;
    case SyntaxKind.TakeOperator:
      visitTakeOperator(qc, qb, v as Syntax.TakeOperator);
      return qb;
    case SyntaxKind.ParseOperator:
      return visitParseOperator(qc, qb, v as Syntax.ParseOperator);
    case SyntaxKind.CountOperator:
      return visitCountOperator(qc, qb, v as Syntax.CountOperator);
    case SyntaxKind.DistinctOperator:
      return visitDistinctOperator(qc, qb, v as Syntax.DistinctOperator);
    case SyntaxKind.ExtendOperator:
      return visitExtendOperator(qc, qb, v as Syntax.ExtendOperator);
    default:
      qc.logUnknown(`unhandled kind: ${kustoHelper.getSyntaxKindName(v.Kind)}`);
      return qb;
  }
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

  let sql = compiledQB.toQuery();
  sql = unescapeRegexPlaceholders(sql);

  return { sql };
}