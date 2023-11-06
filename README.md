# Systemic TS Utils

Paraphernalia to facilitate writing [Systemic TypeScript](https://valand.dev/systemic-ts) code.

## Separated Imports

All modules are available under "." exports.

```
import * as SystemicTsUtils from "systemic-ts-utils"
```

However, separate modules are also provided to make it easy to tree-shake, and so on:

- `systemic-ts-utils/async-utils`: Currently only contains `sleep`, a `Promise` wrapper for `setTimeout`
- `systemic-ts-utils/destruction`: Alleviate the absence of `destructor` in JavaScript
- `systemic-ts-utils/erpromise`: Externally Resolvable/Rejectable Promise and Abortables
- `systemic-ts-utils/iter-cell`: IteratorCell, an immutable container for mutable Set, Map, and Array.
- `systemic-ts-utils/lock`: Various locks for working with concurrent operations.
- `systemic-ts-utils/obs`: Simple typed event emitter and pipe objects
- `systemic-ts-utils/purge-memo`: Memoized function and manual purging
- `systemic-ts-utils/valcon`: Simple and/or observable value container 

```
// For example:
import * as Locks from "systemic-ts-utils/lock"
```
