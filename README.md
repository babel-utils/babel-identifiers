# babel-identifiers

> Classify Babel identifiers

### Installation

```sh
yarn add babel-identifiers
```

### Usage

Identifier nodes fall into one of three kinds:

1. "binding" - `let binding = ...`
2. "reference" - `reference;`
3. "static" - `a.static`

And into one of four grammars:

1. "javascript" - `let javascript = ...`
1. "jsx" - `<jsx/>`
2. "flow" - `({}: flow)`
3. "typescript" - `enum typescript {}`

```js
import {getIdentifierKind, getIdentifierGrammar} from 'babel-identifiers';

isIdentifierLike(path); // true | false
getIdentifierKind(path); // "binding" | "reference" | "static"
getIdentifierGrammar(path); // "javascript" | "flow" | "typescript"
```
