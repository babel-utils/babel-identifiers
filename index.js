'use strict';

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
};

type IdentifierKinds = 'reference' | 'binding' | 'static';
*/

let isAssignmentTargetPattern = path => {
  return (
    path.isObjectPattern() ||
    path.isArrayPattern() ||
    path.isRestElement()
  );
};

exports.getIdentifierKind = (path /*: Path */) /*: IdentifierKinds */ => {
  let parentPath = path.parentPath;
  let parentKey = path.parentKey;
  let node = path.node;

  if (path.isIdentifier()) {
    if (
      parentPath.isMemberExpression() &&
      parentKey === 'property' &&
      !path.node.computed
    ) {
      return 'static';
    }

    if (parentPath.isObjectProperty() && parentPath.parentPath.isObjectPattern()) {
      if (parentKey === 'key') return 'binding';
      if (parentKey === 'value') return 'binding';
    }

    if (isAssignmentTargetPattern(parentPath)) {
      let search = path;
      do {
        search = search.parentPath;
        if (search.isVariableDeclarator() || search.isFunction()) {
          return 'binding';
        }
      } while (isAssignmentTargetPattern(search));
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
  }

  if (path.isTypeParameter()) {
    return 'binding';
  }

  return 'reference';
};
