# babel-identifiers

> Classify Babel identifiers

### Installation

```sh
yarn add babel-identifiers
```

### Usage

Identifier nodes fall into one of three categories:

1. "binding" - `let binding = ...`
2. "reference" - `reference;`
3. "static" - `a.static`

```js
import {getIdentifierKind} from 'babel-identifiers';

getIdentifierKind(path); // "binding" | "reference" | "static"
```

This should work for all identifiers, even those in Flow or TypeScript.
