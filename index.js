'use strict';
const astPrettyPrint = require('ast-pretty-print');

const {getTypeBinding} = require('babel-type-scopes');

/*::
type Node = {
  type: string,
  [key: string]: any,
};

type Path = {
  type: string,
  node: Node,
  parent: Node,
  parentPath: Path,
  [key: string]: any,
}

type IdentifierKinds = 'reference' | 'binding' | 'static';
type IdentifierGrammars = 'javascript' | 'jsx' | 'flow' | 'typescript';
*/

let isAssignmentTargetPattern = (parentPath, parentKey) => {
  return (
    parentPath.isObjectPattern() ||
    parentPath.isArrayPattern() ||
    parentPath.isRestElement() ||
    (parentPath.isObjectProperty() && parentPath.parentPath.isObjectPattern()) ||
    parentPath.isAssignmentPattern() && parentKey === 'left'
  );
};

function isIdentifierLike(path /*: Path */) /*: boolean */ {
  return (
    path.isIdentifier() ||
    path.isTypeParameter() ||
    path.type === 'TSTypeParameter' ||
    path.isJSXIdentifier()
  );
}

function getIdentifierKind(path /*: Path */) /*: IdentifierKinds */ {
  let parentPath = path.parentPath;
  let parentKey = path.parentKey;


  if (path.isIdentifier()) {
    if (
      parentPath.isMemberExpression() &&
      parentKey === 'property' &&
      !path.parent.computed
    ) {
      return 'static';
    }

    if (parentPath.isObjectProperty() && parentPath.parentPath.isObjectPattern()) {
      if (parentKey === 'key') return 'static';
      if (parentKey === 'value') return 'binding';
    }

    if (isAssignmentTargetPattern(parentPath, parentKey)) {
      let search = path;
      let searchKey;
      do {
        searchKey = search.parentKey;
        search = search.parentPath;
        if (search.isVariableDeclarator() || search.isFunction()) {
          return 'binding';
        }
      } while (isAssignmentTargetPattern(search, searchKey));
    }

    if (parentPath.isObjectProperty() || parentPath.isObjectMember()) {
      if (parentKey === 'key' && !parentPath.node.computed) {
        return 'static';
      }
    }

    if (parentPath.isVariableDeclarator() && parentKey === 'id') {
      return 'binding';
    }

    if (parentPath.isFunction()) {
      if (parentKey === 'id') return 'binding';
      if (parentKey === 'params') return 'binding';
    }

    if (parentPath.isClass() && parentKey === 'id') {
      return 'binding';
    }

    if (parentPath.isCatchClause() && parentKey === 'param') {
      return 'binding';
    }

    if (parentPath.isImportDefaultSpecifier() || parentPath.isImportNamespaceSpecifier()) {
      return 'binding';
    }

    if (parentPath.isImportSpecifier()) {
      if (parentKey === 'imported') return 'static';
      if (parentKey === 'local') return 'binding';
    }

    if (parentPath.isExportDefaultSpecifier() || parentPath.isExportNamespaceSpecifier()) {
      return 'static';
    }

    if (parentPath.isExportSpecifier()) {
      if (parentKey === 'exported') return 'static';
      if (parentKey === 'local' && parentPath.parentPath.node.source) return 'static';
    }

    if (parentPath.isTypeAlias() && parentKey === 'id') {
      return 'binding';
    }

    if (parentPath.isInterfaceDeclaration() && parentKey === 'id') {
      return 'binding';
    }

    if (parentPath.isFunctionTypeParam() && parentKey === 'name') {
      return 'static';
    }

    if (parentPath.isObjectTypeProperty() && parentKey === 'key') {
      return 'static';
    }

    if (parentPath.isObjectTypeIndexer() && parentKey === 'id') {
      return 'static';
    }

    if (parentPath.type === 'TSInterfaceDeclaration' && parentKey === 'id') {
      return 'binding';
    }

    if (parentPath.type === 'TSEnumDeclaration' && parentKey === 'id') {
      return 'binding';
    }

    if (parentPath.type === 'TSTypeAliasDeclaration' && parentKey === 'id') {
      return 'binding';
    }

    if (parentPath.type === 'TSModuleDeclaration' && parentKey === 'id') {
      return 'binding';
    }
  }

  if (path.isTypeParameter()) {
    return 'binding';
  }

  if (path.type === 'TSTypeParameter') {
    return 'binding';
  }

  if (path.isJSXIdentifier()) {
    if (parentPath.isJSXMemberExpression()) {
      if (parentKey === 'property') {
        return 'static';
      }
    } else {
      let name = path.node.name;
      if (name[0] === name[0].toLowerCase()) {
        return 'static';
      }
    }
  }

  return 'reference';
}

function getIdentifierGrammar(path /*: Path */) /*: IdentifierGrammars */ {
  let parentPath = path.parentPath;
  let parentKey = path.parentKey;

  if (path.isTypeParameter()) {
    if (parentPath.isTypeParameterDeclaration()) return 'flow';
    if (parentPath.type === 'TSMappedType') return 'typescript';
    throw new Error(`Unhandled TypeParameter parent type: ${path.parent.type}`);
  }

  if (parentPath.isTypeAlias() && parentKey === 'id') return 'flow';
  if (parentPath.isInterfaceDeclaration() && parentKey === 'id') return 'flow';
  if (parentPath.isGenericTypeAnnotation() && parentKey === 'id') return 'flow';
  if (parentPath.isClassImplements() && parentKey === 'id') return 'flow';
  if (parentPath.isFunctionTypeParam() && parentKey === 'name') return 'flow';
  if (parentPath.isObjectTypeProperty() && parentKey === 'key') return 'flow';
  if (parentPath.isObjectTypeIndexer() && parentKey === 'id') return 'flow';

  if (parentPath.type === 'TSTypeReference' && parentKey === 'typeName') return 'typescript';
  if (parentPath.type === 'TSInterfaceDeclaration' && parentKey === 'id') return 'typescript';
  if (parentPath.type === 'TSEnumDeclaration' && parentKey === 'id') return 'typescript';
  if (parentPath.type === 'TSTypeAliasDeclaration' && parentKey === 'id') return 'typescript';
  if (parentPath.type === 'TSModuleDeclaration' && parentKey === 'id') return 'typescript';
  if (path.type === 'TSTypeParameter') return 'typescript';
  if (path.isJSXIdentifier()) return 'jsx';

  return 'javascript';
}

module.exports = {
  isIdentifierLike,
  getIdentifierKind,
  getIdentifierGrammar,
};
