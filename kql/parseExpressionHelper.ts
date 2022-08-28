import * as kustoHelper from './kustoHelper';
import { Syntax, SyntaxKind } from './kustoHelper';

// TODO: support other types (implement coercion)
const primitiveTypeToPattern = {
  'string': '.*',
  'long': '\\d+',
};

function asRe2CaptureGroup(name: string, pattern: string): string {
  return `(?P<${name.trim()}>${pattern.trim()})`;
}

function nameDeclarationToRegexPartial(node: Syntax.NameDeclaration, pattern?: string): string {
  return asRe2CaptureGroup(node.SimpleName, pattern ?? primitiveTypeToPattern['string']);
}

function nameAndTypeDeclarationToRegexPartial(node: Syntax.NameAndTypeDeclaration): string {
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
): string {
  const regexpPattern: string[] = [];

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
        regexpPattern.push(nameDeclarationToRegexPartial(child as Syntax.NameDeclaration));
        break;
      case SyntaxKind.NameAndTypeDeclaration:
        regexpPattern.push(nameAndTypeDeclarationToRegexPartial(child as Syntax.NameAndTypeDeclaration));
        break;
      default:
        const childKindName = kustoHelper.getSyntaxKindName(child.Kind);
        const childLiteral = kustoHelper.kqlToString(child);
        console.log(`unsupported child expression: ${childKindName} (${childLiteral})`);
    }
  }

  return regexpPattern.join('');
}