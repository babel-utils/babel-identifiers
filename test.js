// @flow
'use strict';

const cases = require('jest-in-case');
const createBabylonOptions = require('babylon-options');
const {isIdentifierLike, getIdentifierKind, getIdentifierGrammar} = require('./');
const printAST = require('ast-pretty-print');
const babel = require('@babel/core');

function parse(code, plugins) {
  let filePath;

  babel.transform(code, {
    ast: false,
    code: false,
    babelrc: false,
    parserOpts: createBabylonOptions({
      stage: 1,
      plugins,
    }),
    plugins: [{
      visitor: {
        Program(path) {
          filePath = path.hub.file.path;
        }
      },
    }]
  });

  return filePath;
}

function getKindsAndGrammars(path) {
  let kinds = [];
  let grammars = [];

  path.traverse({
    enter(path) {
      if (isIdentifierLike(path)) {
        kinds.push(`${path.node.name}:${getIdentifierKind(path)}`);
        grammars.push(`${path.node.name}:${getIdentifierGrammar(path)}`);
      }
    }
  });

  return {kinds, grammars};
}

cases('identifiers', opts => {
  let path = parse(opts.code, opts.plugins);
  let {kinds, grammars} = getKindsAndGrammars(path);

  try {
    expect(kinds).toEqual(opts.kinds);
    expect(grammars).toEqual(opts.grammars);
  } catch (err) {
    console.log('---\n\n' + opts.code + '\n\n---\n\n' + printAST(path, true) + '\n\n---');
    throw err;
  }
}, [{
  name: 'member expression',
  plugins: [],
  code: 'a.b',
  kinds: ['a:reference', 'b:static'],
  grammars: ['a:javascript', 'b:javascript'],
}, {
  name: 'member expression computed',
  plugins: [],
  code: 'a[b]',
  kinds: ['a:reference', 'b:reference'],
  grammars: ['a:javascript', 'b:javascript'],
}, {
  name: 'object property',
  plugins: [],
  code: '({ a: b })',
  kinds: ['a:static', 'b:reference'],
  grammars: ['a:javascript', 'b:javascript'],
}, {
  name: 'object property computed',
  plugins: [],
  code: '({ [a]: b })',
  kinds: ['a:reference', 'b:reference'],
  grammars: ['a:javascript', 'b:javascript'],
}, {
  name: 'object method',
  plugins: [],
  code: '({ a() {} })',
  kinds: ['a:static'],
  grammars: [],
  grammars: ['a:javascript'],
}, {
  name: 'object method computed',
  plugins: [],
  code: '({ [a]() {} })',
  kinds: ['a:reference'],
  grammars: ['a:javascript'],
}, {
  name: 'let object pattern',
  plugins: [],
  code: 'let {a} = {}',
  kinds: ['a:static', 'a:binding'],
  grammars: ['a:javascript', 'a:javascript'],
}, {
  name: 'let object pattern nested',
  plugins: [],
  code: 'let {a: {b}} = {}',
  kinds: ['a:static', 'b:static', 'b:binding'],
  grammars: ['a:javascript', 'b:javascript', 'b:javascript'],
}, {
  name: 'let object pattern renamed',
  plugins: [],
  code: 'let {a: b} = {}',
  kinds: ['a:static', 'b:binding'],
  grammars: ['a:javascript', 'b:javascript'],
}, {
  name: 'function param object pattern',
  plugins: [],
  code: '(({a}) => {})',
  kinds: ['a:static', 'a:binding'],
  grammars: ['a:javascript', 'a:javascript'],
}, {
  name: 'function param object pattern nested',
  plugins: [],
  code: '(({a: {b}}) => {})',
  kinds: ['a:static', 'b:static', 'b:binding'],
  grammars: ['a:javascript', 'b:javascript', 'b:javascript'],
}, {
  name: 'function param object pattern renamed',
  plugins: [],
  code: '(({a: b}) => {})',
  kinds: ['a:static', 'b:binding'],
  grammars: ['a:javascript', 'b:javascript'],
}, {
  name: 'array expression',
  plugins: [],
  code: '[a]',
  kinds: ['a:reference'],
  grammars: ['a:javascript'],
}, {
  name: 'array pattern',
  plugins: [],
  code: '[a] = []',
  kinds: ['a:reference'],
  grammars: ['a:javascript'],
}, {
  name: 'array pattern nested',
  plugins: [],
  code: '[[a]] = []',
  kinds: ['a:reference'],
  grammars: ['a:javascript'],
}, {
  name: 'let array pattern',
  plugins: [],
  code: 'let [a, ...b] = []',
  kinds: ['a:binding', 'b:binding'],
  grammars: ['a:javascript', 'b:javascript'],
}, {
  name: 'let array pattern nested',
  plugins: ['flow'],
  code: 'let [[a, ...b]] = []',
  kinds: ['a:binding', 'b:binding'],
  grammars: ['a:javascript', 'b:javascript'],
}, {
  name: 'let array pattern nested object',
  plugins: [],
  code: 'let { a: [b, ...c] } = {}',
  kinds: ['a:static', 'b:binding', 'c:binding'],
  grammars: ['a:javascript', 'b:javascript', 'c:javascript'],
}, {
  name: 'let',
  plugins: [],
  code: 'let a = b',
  kinds: ['a:binding', 'b:reference'],
  grammars: ['a:javascript', 'b:javascript'],
}, {
  name: 'function declaration',
  plugins: [],
  code: 'function a(b, ...c) {}',
  kinds: ['a:binding', 'b:binding', 'c:binding'],
  grammars: ['a:javascript', 'b:javascript', 'c:javascript'],
}, {
  name: 'function arg pattern',
  plugins: ['flow'],
  code: 'function a(b = c) {}',
  result: ['a:binding', 'b:binding', 'c:reference'],
}, {
  name: 'function arg object pattern',
  plugins: ['flow'],
  code: 'function a({ b: c } = d) {}',
  result: ['a:binding', 'b:static', 'c:binding', 'd:reference'],
}, {
  name: 'function arg object pattern',
  plugins: ['flow'],
  code: 'function a([b] = c) {}',
  result: ['a:binding', 'b:binding', 'c:reference'],
}, {
  name: 'function arg deep object pattern',
  plugins: ['flow'],
  code: 'function a({ b: { c: { d } } } = e) {}',
  result: ['a:binding', 'b:static', 'c:static', 'd:static', 'd:binding', 'e:reference'],
}, {
  name: 'function expression',
  plugins: [],
  code: '(function a(b, ...c) {})',
  kinds: ['a:binding', 'b:binding', 'c:binding'],
  grammars: ['a:javascript', 'b:javascript', 'c:javascript'],
}, {
  name: 'class declaration',
  plugins: [],
  code: 'class a {}',
  kinds: ['a:binding'],
  grammars: ['a:javascript'],
}, {
  name: 'class expression',
  plugins: [],
  code: '(class a {})',
  kinds: ['a:binding'],
  grammars: ['a:javascript'],
}, {
  name: 'for loop',
  plugins: [],
  code: 'for (let a;;) {}',
  kinds: ['a:binding'],
  grammars: ['a:javascript'],
}, {
  name: 'for loop reference',
  plugins: [],
  code: 'for (a;;) {}',
  kinds: ['a:reference'],
  grammars: ['a:javascript'],
}, {
  name: 'import default',
  plugins: [],
  code: 'import a from ""',
  kinds: ['a:binding'],
  grammars: ['a:javascript'],
}, {
  name: 'import named',
  plugins: [],
  code: 'import {a} from ""',
  kinds: ['a:binding', 'a:static'],
  grammars: ['a:javascript', 'a:javascript'],
}, {
  name: 'import named renamed',
  plugins: [],
  code: 'import {a as b} from ""',
  kinds: ['b:binding', 'a:static'],
  grammars: ['b:javascript', 'a:javascript'],
}, {
  name: 'export default from',
  plugins: [],
  code: 'export a from ""',
  kinds: ['a:static'],
  grammars: ['a:javascript'],
}, {
  name: 'export namespace from',
  plugins: [],
  code: 'export * as a from ""',
  kinds: ['a:static'],
  grammars: ['a:javascript'],
}, {
  name: 'export named',
  plugins: [],
  code: 'export {a}',
  kinds: ['a:reference', 'a:static'],
  grammars: ['a:javascript', 'a:javascript'],
}, {
  name: 'export named renamed',
  plugins: [],
  code: 'export {a as b}',
  kinds: ['a:reference', 'b:static'],
  grammars: ['a:javascript', 'b:javascript'],
}, {
  name: 'export named from',
  plugins: [],
  code: 'export {a} from ""',
  kinds: ['a:static', 'a:static'],
  grammars: ['a:javascript', 'a:javascript'],
}, {
  name: 'export named from renamed',
  plugins: [],
  code: 'export {a as b} from ""',
  kinds: ['a:static', 'b:static'],
  grammars: ['a:javascript', 'b:javascript'],
}, {
  name: 'type alias',
  plugins: ['flow'],
  code: 'type a = {}',
  kinds: ['a:binding'],
  grammars: ['a:flow'],
}, {
  name: 'interface declaration',
  plugins: ['flow'],
  code: 'interface a {}',
  kinds: ['a:binding'],
  grammars: ['a:flow'],
}, {
  name: 'type params declaration',
  plugins: ['flow'],
  code: 'type a<b: c = d> = {}',
  kinds: ['a:binding', 'b:binding', 'c:reference', 'd:reference'],
  grammars: ['a:flow', 'b:flow', 'c:flow', 'd:flow'],
}, {
  name: 'class type param',
  plugins: ['flow'],
  code: 'class a<b> {}',
  kinds: ['a:binding', 'b:binding'],
  grammars: ['a:javascript', 'b:flow'],
}, {
  name: 'class extends',
  plugins: [],
  code: 'class a extends b {}',
  kinds: ['a:binding', 'b:reference'],
  grammars: ['a:javascript', 'b:javascript'],
}, {
  name: 'class extends type param',
  plugins: ['flow'],
  code: 'class a extends b<c> {}',
  kinds: ['a:binding', 'b:reference', 'c:reference'],
  grammars: ['a:javascript', 'b:javascript', 'c:flow'],
}, {
  name: 'class implements',
  plugins: ['flow'],
  code: 'class a implements b {}',
  kinds: ['a:binding', 'b:reference'],
  grammars: ['a:javascript', 'b:flow'],
}, {
  name: 'class implements type param',
  plugins: ['flow'],
  code: 'class a implements b<c> {}',
  kinds: ['a:binding', 'b:reference', 'c:reference'],
  grammars: ['a:javascript', 'b:flow', 'c:flow'],
}, {
  name: 'function type return',
  plugins: ['flow'],
  code: 'type a = () => b',
  kinds: ['a:binding', 'b:reference'],
  grammars: ['a:flow', 'b:flow'],
}, {
  name: 'function type param',
  plugins: ['flow'],
  code: 'type a = (b: c) => {}',
  kinds: ['a:binding', 'b:static', 'c:reference'],
  grammars: ['a:flow', 'b:flow', 'c:flow'],
}, {
  name: 'function type param unnamed',
  plugins: ['flow'],
  code: 'type a = (b) => {}',
  kinds: ['a:binding', 'b:reference'],
  grammars: ['a:flow', 'b:flow'],
}, {
  name: 'function type type param',
  plugins: ['flow'],
  code: 'type a = <b>() => {}',
  kinds: ['a:binding', 'b:binding'],
  grammars: ['a:flow', 'b:flow'],
}, {
  name: 'object type property',
  plugins: ['flow'],
  code: 'type a = { b: c }',
  kinds: ['a:binding', 'b:static', 'c:reference'],
  grammars: ['a:flow', 'b:flow', 'c:flow'],
}, {
  name: 'object type method',
  plugins: ['flow'],
  code: 'type a = { b(): c }',
  kinds: ['a:binding', 'b:static', 'c:reference'],
  grammars: ['a:flow', 'b:flow', 'c:flow'],
}, {
  name: 'object type indexer',
  plugins: ['flow'],
  code: 'type a = { [b: c]: d }',
  kinds: ['a:binding', 'b:static', 'c:reference', 'd:reference'],
  grammars: ['a:flow', 'b:flow', 'c:flow', 'd:flow'],
}, {
  name: 'object type computed property',
  plugins: ['flow'],
  code: 'type a = { [b]: c }',
  kinds: ['a:binding', 'b:reference', 'c:reference'],
  grammars: ['a:flow', 'b:flow', 'c:flow'],
}, {
  name: 'ts interface',
  plugins: ['typescript'],
  code: 'interface a {}',
  kinds: ['a:binding'],
  grammars: ['a:typescript'],
}, {
  name: 'ts enum',
  plugins: ['typescript'],
  code: 'enum a {}',
  kinds: ['a:binding'],
  grammars: ['a:typescript'],
}, {
  name: 'ts alias',
  plugins: ['typescript'],
  code: 'type a = {}',
  kinds: ['a:binding'],
  grammars: ['a:typescript'],
}, {
  name: 'ts namespace',
  plugins: ['typescript'],
  code: 'namespace a {}',
  kinds: ['a:binding'],
  grammars: ['a:typescript'],
}, {
  name: 'ts module',
  plugins: ['typescript'],
  code: 'module a {}',
  kinds: ['a:binding'],
  grammars: ['a:typescript'],
}, {
  name: 'ts type param instantiation',
  plugins: ['typescript'],
  code: 'class a<b> {}',
  kinds: ['a:binding', 'b:binding'],
  grammars: ['a:javascript', 'b:typescript'],
}, {
  name: 'ts type param instantiation extends',
  plugins: ['typescript'],
  code: 'class a<b extends c> {}',
  kinds: ['a:binding', 'b:binding', 'c:reference'],
  grammars: ['a:javascript', 'b:typescript', 'c:typescript'],
}, {
  name: 'ts type param',
  plugins: ['typescript'],
  code: 'class a extends b<c> {}',
  kinds: ['a:binding', 'b:reference', 'c:reference'],
  grammars: ['a:javascript', 'b:javascript', 'c:typescript'],
}, {
  name: 'ts mapped type',
  plugins: ['typescript'],
  code: 'type a = { [b in keyof c]: d }',
  kinds: ['a:binding', 'b:binding', 'c:reference', 'd:reference'],
  grammars: ['a:typescript', 'b:typescript', 'c:typescript', 'd:typescript'],
}, {
  name: 'ts type annotation',
  plugins: ['typescript'],
  code: 'function a(b: c) {}',
  kinds: ['a:binding', 'b:binding', 'c:reference'],
  grammars: ['a:javascript', 'b:javascript', 'c:typescript'],
}, {
  name: 'jsx element',
  plugins: ['jsx'],
  code: '<a/>',
  kinds: ['a:static'],
  grammars: ['a:jsx'],
}, {
  name: 'jsx element uppercase',
  plugins: ['jsx'],
  code: '<A/>',
  kinds: ['A:reference'],
  grammars: ['A:jsx'],
}, {
  name: 'jsx member expression',
  plugins: ['jsx'],
  code: '<a.b/>',
  kinds: ['a:reference', 'b:static'],
  grammars: ['a:jsx', 'b:jsx'],
}, {
  name: 'jsx element property',
  plugins: ['jsx'],
  code: '<a b/>',
  kinds: ['a:static', 'b:static'],
  grammars: ['a:jsx', 'b:jsx'],
}, {
  name: 'jsx element property with value',
  plugins: ['jsx'],
  code: '<a b={true}/>',
  kinds: ['a:static', 'b:static'],
  grammars: ['a:jsx', 'b:jsx'],
}, {
  name: 'jsx element spread property',
  plugins: ['jsx'],
  code: '<a {...b}/>',
  kinds: ['a:static', 'b:reference'],
  grammars: ['a:jsx', 'b:javascript'],
}, {
  name: 'jsx children',
  plugins: ['jsx'],
  code: '<a>{b}</a>',
  kinds: ['a:static', 'b:reference', 'a:static'],
  grammars: ['a:jsx', 'b:javascript', 'a:jsx'],
}, {
  name: 'jsx spread children',
  plugins: ['jsx'],
  code: '<a>{...b}</a>',
  kinds: ['a:static', 'b:reference', 'a:static'],
  grammars: ['a:jsx', 'b:javascript', 'a:jsx'],
}]);
