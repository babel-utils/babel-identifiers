// @flow
'use strict';

const createBabylonOptions = require('babylon-options');
const {getIdentifierKind} = require('./');
const babel = require('babel-core');

function run(code, plugins) {
  let parserOpts = createBabylonOptions({
    stage: 1,
    plugins,
  });

  let file = new babel.File({
    options: { parserOpts },
    passes: [],
  });

  file.addCode(code);
  file.parseCode(code);

  let results = [];

  file.path.traverse({
    'Identifier|TypeParameter'(path) {
      results.push(`${path.node.name}:${getIdentifierKind(path)}`);
    }
  });

  return results;
}

// const print = (t, value) => {
//   let printed = printAST(value) + '\n';
//   return t.expressionStatement(
//     t.templateLiteral([
//       t.templateElement({ raw: printed }, true)
//     , ])
//   );
// };

const TESTS = [{
  name: 'member expression',
  plugins: ['flow'],
  code: 'a.b',
  result: ['a:reference', 'b:static'],
}, {
  name: 'member expression computed',
  plugins: ['flow'],
  code: 'a[b]',
  result: ['a:reference', 'b:reference'],
}, {
  name: 'object property',
  plugins: ['flow'],
  code: '({ a: b })',
  result: ['a:static', 'b:reference'],
}, {
  name: 'object property computed',
  plugins: ['flow'],
  code: '({ [a]: b })',
  result: ['a:reference', 'b:reference'],
}, {
  name: 'object method',
  plugins: ['flow'],
  code: '({ a() {} })',
  result: ['a:static'],
}, {
  name: 'object method computed',
  plugins: ['flow'],
  code: '({ [a]() {} })',
  result: ['a:reference'],
}, {
  name: 'let object pattern',
  plugins: ['flow'],
  code: 'let {a} = {}',
  result: ['a:static', 'a:binding'],
}, {
  name: 'let object pattern nested',
  plugins: ['flow'],
  code: 'let {a: {b}} = {}',
  result: ['a:static', 'b:static', 'b:binding'],
}, {
  name: 'let object pattern renamed',
  plugins: ['flow'],
  code: 'let {a: b} = {}',
  result: ['a:static', 'b:binding'],
}, {
  name: 'function param object pattern',
  plugins: ['flow'],
  code: '(({a}) => {})',
  result: ['a:static', 'a:binding'],
}, {
  name: 'function param object pattern nested',
  plugins: ['flow'],
  code: '(({a: {b}}) => {})',
  result: ['a:static', 'b:static', 'b:binding'],
}, {
  name: 'function param object pattern renamed',
  plugins: ['flow'],
  code: '(({a: b}) => {})',
  result: ['a:static', 'b:binding'],
}, {
  name: 'array expression',
  plugins: ['flow'],
  code: '[a]',
  result: ['a:reference'],
}, {
  name: 'array pattern',
  plugins: ['flow'],
  code: '[a] = []',
  result: ['a:reference'],
}, {
  name: 'array pattern nested',
  plugins: ['flow'],
  code: '[[a]] = []',
  result: ['a:reference'],
}, {
  name: 'let array pattern',
  plugins: ['flow'],
  code: 'let [a, ...b] = []',
  result: ['a:binding', 'b:binding'],
}, {
  name: 'let array pattern nested',
  plugins: ['flow'],
  code: 'let [[a, ...b]] = []',
  result: ['a:binding', 'b:binding'],
}, {
  name: 'let array pattern nested object',
  plugins: ['flow'],
  code: 'let { a: [b, ...c] } = {}',
  result: ['a:static', 'b:binding', 'c:binding'],
}, {
  name: 'let',
  plugins: ['flow'],
  code: 'let a = b',
  result: ['a:binding', 'b:reference'],
}, {
  name: 'function declaration',
  plugins: ['flow'],
  code: 'function a(b, ...c) {}',
  result: ['a:binding', 'b:binding', 'c:binding'],
}, {
  name: 'function expression',
  plugins: ['flow'],
  code: '(function a(b, ...c) {})',
  result: ['a:binding', 'b:binding', 'c:binding'],
}, {
  name: 'class declaration',
  plugins: ['flow'],
  code: 'class a {}',
  result: ['a:binding'],
}, {
  name: 'class expression',
  plugins: ['flow'],
  code: '(class a {})',
  result: ['a:binding'],
}, {
  name: 'for loop',
  plugins: ['flow'],
  code: 'for (let a;;) {}',
  result: ['a:binding'],
}, {
  name: 'for loop reference',
  plugins: ['flow'],
  code: 'for (a;;) {}',
  result: ['a:reference'],
}, {
  name: 'import default',
  plugins: ['flow'],
  code: 'import a from ""',
  result: ['a:binding'],
}, {
  name: 'import named',
  plugins: ['flow'],
  code: 'import {a} from ""',
  result: ['a:binding', 'a:static'],
}, {
  name: 'import named renamed',
  plugins: ['flow'],
  code: 'import {a as b} from ""',
  result: ['b:binding', 'a:static'],
}, {
  name: 'export default from',
  plugins: ['flow'],
  code: 'export a from ""',
  result: ['a:static'],
}, {
  name: 'export namespace from',
  plugins: ['flow'],
  code: 'export * as a from ""',
  result: ['a:static'],
}, {
  name: 'export named',
  plugins: ['flow'],
  code: 'export {a}',
  result: ['a:reference', 'a:static'],
}, {
  name: 'export named renamed',
  plugins: ['flow'],
  code: 'export {a as b}',
  result: ['a:reference', 'b:static'],
}, {
  name: 'export named from',
  plugins: ['flow'],
  code: 'export {a} from ""',
  result: ['a:static', 'a:static'],
}, {
  name: 'export named from renamed',
  plugins: ['flow'],
  code: 'export {a as b} from ""',
  result: ['a:static', 'b:static'],
}, {
  name: 'type alias',
  plugins: ['flow'],
  code: 'type a = {}',
  result: ['a:binding'],
}, {
  name: 'interface declaration',
  plugins: ['flow'],
  code: 'interface a {}',
  result: ['a:binding'],
}, {
  name: 'type params declaration',
  plugins: ['flow'],
  code: 'type a<b: c = d> = {}',
  result: ['a:binding', 'b:binding', 'c:reference', 'd:reference'],
}, {
  name: 'class type param',
  plugins: ['flow'],
  code: 'class a<b> {}',
  result: ['a:binding', 'b:binding'],
}, {
  name: 'class extends',
  plugins: ['flow'],
  code: 'class a extends b {}',
  result: ['a:binding', 'b:reference'],
}, {
  name: 'class extends type param',
  plugins: ['flow'],
  code: 'class a extends b<c> {}',
  result: ['a:binding', 'b:reference', 'c:reference'],
}, {
  name: 'class implements',
  plugins: ['flow'],
  code: 'class a implements b {}',
  result: ['a:binding', 'b:reference'],
}, {
  name: 'class implements type param',
  plugins: ['flow'],
  code: 'class a implements b<c> {}',
  result: ['a:binding', 'b:reference', 'c:reference'],
}, {
  name: 'function type return',
  plugins: ['flow'],
  code: 'type a = () => b',
  result: ['a:binding', 'b:reference'],
}, {
  name: 'function type param',
  plugins: ['flow'],
  code: 'type a = (b: c) => {}',
  result: ['a:binding', 'b:static', 'c:reference'],
}, {
  name: 'function type param unnamed',
  plugins: ['flow'],
  code: 'type a = (b) => {}',
  result: ['a:binding', 'b:reference'],
}, {
  name: 'function type type param',
  plugins: ['flow'],
  code: 'type a = <b>() => {}',
  result: ['a:binding', 'b:binding'],
}, {
  name: 'object type property',
  plugins: ['flow'],
  code: 'type a = { b: c }',
  result: ['a:binding', 'b:static', 'c:reference'],
}, {
  name: 'object type method',
  plugins: ['flow'],
  code: 'type a = { b(): c }',
  result: ['a:binding', 'b:static', 'c:reference'],
}, {
  name: 'object type indexer',
  plugins: ['flow'],
  code: 'type a = { [b: c]: d }',
  result: ['a:binding', 'b:static', 'c:reference', 'd:reference'],
}, {
  name: 'object type computed property',
  plugins: ['flow'],
  code: 'type a = { [b]: c }',
  result: ['a:binding', 'b:reference', 'c:reference'],
}, {
  name: 'ts interface',
  plugins: ['typescript'],
  code: 'interface a {}',
  result: ['a:binding'],
}, {
  name: 'ts enum',
  plugins: ['typescript'],
  code: 'enum a {}',
  result: ['a:binding'],
}, {
  name: 'ts alias',
  plugins: ['typescript'],
  code: 'type a = {}',
  result: ['a:binding'],
}, {
  name: 'ts namespace',
  plugins: ['typescript'],
  code: 'namespace a {}',
  result: ['a:binding'],
}, {
  name: 'ts module',
  plugins: ['typescript'],
  code: 'module a {}',
  result: ['a:binding'],
}, {
  name: 'ts type param instantiation',
  plugins: ['typescript'],
  code: 'class a<b> {}',
  result: ['a:binding', 'b:binding'],
}, {
  name: 'ts type param instantiation extends',
  plugins: ['typescript'],
  code: 'class a<b extends c> {}',
  result: ['a:binding', 'b:binding', 'c:reference'],
}, {
  name: 'ts type param',
  plugins: ['typescript'],
  code: 'class a extends b<c> {}',
  result: ['a:binding', 'b:reference', 'c:reference'],
}, {
  name: 'ts mapped type',
  plugins: ['typescript'],
  code: 'type a = { [b in keyof c]: d }',
  result: ['a:binding', 'b:binding', 'c:reference', 'd:reference'],
}];


for (let testCase of TESTS) {
  let testFn;

  if (testCase.only) {
    testFn = test.only;
  } else if (testCase.skip) {
    testFn = test.skip;
  } else {
    testFn = test;
  }

  testFn(testCase.name, () => {
    expect(run(testCase.code, testCase.plugins)).toEqual(testCase.result);
  });
}
