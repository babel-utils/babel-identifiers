// @flow
'use strict';

const pluginTester = require('babel-plugin-tester');
const printAST = require('ast-pretty-print');
const getBabylonOptions = require('babylon-options');
const {getIdentifierKind} = require('./');

const babelOptions = {
  parserOpts: getBabylonOptions({
    stage: 0,
    plugins: ['flow'],
  }),
};

const print = (t, value) => {
  let printed = printAST(value) + '\n';
  return t.expressionStatement(
    t.templateLiteral([
      t.templateElement({ raw: printed }, true)
    ], [])
  );
};

const plugin = ({types: t}) => {
  return {
    name: 'test-plugin',
    visitor: {
      Program(path) {
        let ids = [];

        path.traverse({
          'Identifier|TypeParameter'(path) {
            ids.push({
              name: path.node.name,
              kind: getIdentifierKind(path),
            });
          },
        });

        path.pushContainer('body', print(t, ids));
      },
    },
  };
};

pluginTester({
  plugin,
  snapshot: true,
  babelOptions,
  tests: {
    'member expression': 'a.b',
    'member expression computed': 'a[b]',
    'object property': '({ a: b })',
    'object property computed': '({ [a]: b })',
    'object method': '({ a() {} })',
    'object method computed': '({ [a]() {} })',
    'let object pattern': 'let {a} = {}',
    'let object pattern nested': 'let {a: {b}} = {}',
    'let object pattern renamed': 'let {a: b} = {}',
    'function param object pattern': '(({a}) => {})',
    'function param object pattern nested': '(({a: {b}}) => {})',
    'function param object pattern renamed': '(({a: b}) => {})',
    'array expression': '[a]',
    'array pattern': '[a] = []',
    'array pattern nested': '[[a]] = []',
    'let array pattern': 'let [a, ...b] = []',
    'let array pattern nested': 'let [[a, ...b]] = []',
    'let array pattern nested object': 'let { a: [b, ...c] } = {}',
    'let': 'let a = b',
    'function declaration': 'function a(b, ...c) {}',
    'function expression': '(function a(b, ...c) {})',
    'class declaration': 'class a {}',
    'class expression': '(class a {})',
    'for loop': 'for (let a;;) {}',
    'for loop reference': 'for (a;;) {}',
    'import default': 'import a from ""',
    'import named': 'import {a} from ""',
    'import named renamed': 'import {a as b} from ""',
    'export default from': 'export a from ""',
    'export namespace from': 'export * as a from ""',
    'export named': 'export {a}',
    'export named renamed': 'export {a as b}',
    'export named from': 'export {a} from ""',
    'export named from renamed': 'export {a as b} from ""',
    'type alias': 'type a = {}',
    'interface declaration': 'interface a {}',
    'type params declaration': 'type a<b: c = d> = {}',
    'class type param': 'class a<b> {}',
    'class extends': 'class a extends b {}',
    'class extends type param': 'class a extends b<c> {}',
    'class implements': 'class a implements b {}',
    'class implements type param': 'class a implements b<c> {}',
    'function type return': 'type a = () => b',
    'function type param': 'type a = (b: c) => {}',
    'function type param unnamed': 'type a = (b) => {}',
    'function type type param': 'type a = <b>() => {}',
    'object type property': 'type a = { b: c }',
    'object type method': 'type a = { b(): c }',
    'object type indexer': 'type a = { [b: c]: d }',
    'object type computed property': 'type a = { [b]: c }',
  },
});
