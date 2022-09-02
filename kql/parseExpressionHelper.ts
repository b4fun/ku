import * as kustoHelper from './kustoHelper';
import { Syntax, SyntaxKind } from './kustoHelper';

export interface ParseTarget {
  readonly regexpPattern: string;
  readonly virtualColumns: string[];
}

interface CaptureTarget {
  readonly columnName: string;
  readonly captureGroup: string;
}

// TODO: support other types (implement coercion)
const primitiveTypeToPattern = {
  'string': '.*',
  'long': '\\d+',
};

function asRe2CaptureGroup(name: string, pattern: string): CaptureTarget {
  return {
    columnName: name,
    // using \\\\? to escape the \?
    captureGroup: `(\\\\?P<${name.trim()}>${pattern.trim()})`,
  };
}

function nameDeclarationToRegexPartial(node: Syntax.NameDeclaration, pattern?: string): CaptureTarget {
  return asRe2CaptureGroup(node.SimpleName, pattern ?? primitiveTypeToPattern['string']);
}

function nameAndTypeDeclarationToRegexPartial(node: Syntax.NameAndTypeDeclaration): CaptureTarget {
  const primitiveTypeName = kustoHelper.kqlToString(node.Type);

  const pattern = primitiveTypeToPattern[primitiveTypeName];
  if (!pattern) {
    const literal = kustoHelper.kqlToString(node);
    throw new Error(`unsupported primitive type ${primitiveTypeName} (in "${literal}")`);
  }

  return nameDeclarationToRegexPartial(node.Name, pattern);
}

export function parsePatternsToRe2(
  patterns: Syntax.SyntaxList$1<Syntax.SyntaxNode>
): ParseTarget {
  const regexpPattern: string[] = [];
  const virtualColumns: string[] = [];

  for (let idx = 0; idx < patterns.ChildCount; idx++) {
    const child = patterns.GetChild(idx);

    switch (child.Kind) {
      case SyntaxKind.StarExpression:
        // * -> .*
        regexpPattern.push('.*');
        break;
      case SyntaxKind.StringLiteralExpression:
        regexpPattern.push(kustoHelper.getTokenValue(child));
        break;
      case SyntaxKind.NameDeclaration:
        const nameDeclarationCaptureGroup = nameDeclarationToRegexPartial(child as Syntax.NameDeclaration)
        regexpPattern.push(nameDeclarationCaptureGroup.captureGroup);
        virtualColumns.push(nameDeclarationCaptureGroup.columnName);
        break;
      case SyntaxKind.NameAndTypeDeclaration:
        const nameAndTypeDeclarationCaptureGroup = nameAndTypeDeclarationToRegexPartial(child as Syntax.NameAndTypeDeclaration);
        regexpPattern.push(nameAndTypeDeclarationCaptureGroup.captureGroup);
        virtualColumns.push(nameAndTypeDeclarationCaptureGroup.columnName);
        break;
      default:
        const childKindName = kustoHelper.getSyntaxKindName(child.Kind);
        const childLiteral = kustoHelper.kqlToString(child);
        console.log(`unsupported child expression: ${childKindName} (${childLiteral})`);
    }
  }

  return {
    regexpPattern: regexpPattern.join(''),
    virtualColumns,
  };
}