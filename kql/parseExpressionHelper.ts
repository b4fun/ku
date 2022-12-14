import * as kustoHelper from './kustoHelper';
import { Syntax, SyntaxKind } from './kustoHelper';

// regexQuestionMark defines the special placeholder for the `?` used in the regex.
// We need this to avoid mixing with knex's query parameter placeholder, which is also `?`.
// We will use `regexQuestionMark` to represent the `?` in the regex, and replace back with `?`
// after compiling by knex.
const regexQuestionMark = '<regexQuestionMark>';

export function unescapeRegexPlaceholders(s: string): string {
  return s.replaceAll(regexQuestionMark, '?');
}

export type PrimitiveType = 'string' | 'long';

export const PrimitiveTypeString: PrimitiveType = 'string';
export const PrimitiveTypeLong: PrimitiveType = 'long';

export interface VirtualColumn {
  readonly columnName: string;
  readonly primitiveType: PrimitiveType;
}

export interface ParseTarget {
  readonly regexpPattern: string;
  readonly virtualColumns: VirtualColumn[];
}

interface CaptureTarget {
  readonly columnName: string;
  readonly captureGroup: string;
  readonly primitiveType: PrimitiveType;
}

// TODO: support other types (implement coercion)
const primitiveTypeToPattern = {
  [PrimitiveTypeString]: `.*${regexQuestionMark}`,
  [PrimitiveTypeLong]: '\\d+',
};

function asRe2CaptureGroup(name: string, pattern: string, primitiveType: PrimitiveType): CaptureTarget {
  return {
    columnName: name,
    captureGroup: `(${regexQuestionMark}P<${name.trim()}>${pattern.trim()})`,
    primitiveType,
  };
}

function nameDeclarationToRegexPartial(node: Syntax.NameDeclaration, pattern?: string, primitiveType?: PrimitiveType): CaptureTarget {
  return asRe2CaptureGroup(
    node.SimpleName,
    pattern ?? primitiveTypeToPattern[PrimitiveTypeString],
    primitiveType ?? PrimitiveTypeString,
  );
}

function nameAndTypeDeclarationToRegexPartial(node: Syntax.NameAndTypeDeclaration): CaptureTarget {
  const primitiveTypeName = kustoHelper.kqlToString(node.Type);

  const pattern = primitiveTypeToPattern[primitiveTypeName];
  if (!pattern) {
    const literal = kustoHelper.kqlToString(node);
    throw new Error(`unsupported primitive type ${primitiveTypeName} (in "${literal}")`);
  }

  return nameDeclarationToRegexPartial(node.Name, pattern, primitiveTypeName as PrimitiveType);
}

export function parsePatternsToRe2(
  patterns: Syntax.SyntaxList$1<Syntax.SyntaxNode>
): ParseTarget {
  const regexpPattern: string[] = [];
  const virtualColumns: VirtualColumn[] = [];

  for (let idx = 0; idx < patterns.ChildCount; idx++) {
    const child = patterns.GetChild(idx);

    switch (child.Kind) {
      case SyntaxKind.StarExpression:
        regexpPattern.push(primitiveTypeToPattern[PrimitiveTypeString]);
        break;
      case SyntaxKind.StringLiteralExpression:
        regexpPattern.push(kustoHelper.getTokenValue(child));
        break;
      case SyntaxKind.NameDeclaration:
        const nameDeclarationCaptureGroup = nameDeclarationToRegexPartial(child as Syntax.NameDeclaration)
        regexpPattern.push(nameDeclarationCaptureGroup.captureGroup);
        virtualColumns.push({
          columnName: nameDeclarationCaptureGroup.columnName,
          primitiveType: nameDeclarationCaptureGroup.primitiveType,
        });
        break;
      case SyntaxKind.NameAndTypeDeclaration:
        const nameAndTypeDeclarationCaptureGroup = nameAndTypeDeclarationToRegexPartial(child as Syntax.NameAndTypeDeclaration);
        regexpPattern.push(nameAndTypeDeclarationCaptureGroup.captureGroup);
        virtualColumns.push({
          columnName: nameAndTypeDeclarationCaptureGroup.columnName,
          primitiveType: nameAndTypeDeclarationCaptureGroup.primitiveType,
        });
        break;
      default:
        const childKindName = kustoHelper.getSyntaxKindName(child.Kind);
        const childLiteral = kustoHelper.kqlToString(child);
        console.log(`unsupported child expression: ${childKindName} (${childLiteral})`);
    }
  }

  return {
    regexpPattern: '^' + regexpPattern.join('') + '$',
    virtualColumns,
  };
}