# deepsignal

## 1.3.2

### Patch Changes

- [#26](https://github.com/luisherranz/deepsignal/pull/26) [`afeacef`](https://github.com/luisherranz/deepsignal/commit/afeacef1f1f1cf6f2f936f20faee38a225aeb2ff) Thanks [@luisherranz](https://github.com/luisherranz)! - Add support for the `ownKeys` trap, which is used with `for..in`, `getOwnPropertyNames` or `Object.keys/values/entries`.

## 1.3.1

### Patch Changes

- [#20](https://github.com/luisherranz/deepsignal/pull/20) [`a945b8a`](https://github.com/luisherranz/deepsignal/commit/a945b8a564502d9ec757024b9d7615734f55e91c) Thanks [@luisherranz](https://github.com/luisherranz)! - Don't proxy existing proxies to make sure that copying refs (objects) works exactly like in plain JavaScript objects.

* [#23](https://github.com/luisherranz/deepsignal/pull/23) [`2285925`](https://github.com/luisherranz/deepsignal/commit/2285925fa3d864650c8d220482806b8ca1922aaf) Thanks [@luisherranz](https://github.com/luisherranz)! - Add support for deleting object properties, like `delete store.a`.

## 1.3.0

### Minor Changes

- [#11](https://github.com/luisherranz/deepsignal/pull/11) [`e562f1d`](https://github.com/luisherranz/deepsignal/commit/e562f1d4e22e1885eb9e5055a05c6abde600616e) Thanks [@luisherranz](https://github.com/luisherranz)! - Add official support for React with the `deepsignal/react` entry point.

## 1.2.1

### Patch Changes

- [#14](https://github.com/luisherranz/deepsignal/pull/14) [`702506b`](https://github.com/luisherranz/deepsignal/commit/702506b98bf8fccabba567382f60a59b31d66f54) Thanks [@luisherranz](https://github.com/luisherranz)! - Fix wrong artifacts being generated on signal assignments. _Bug spotted by @DAreRodz._

## 1.2.0

### Minor Changes

- [#12](https://github.com/luisherranz/deepsignal/pull/12) [`f2c5d5b`](https://github.com/luisherranz/deepsignal/commit/f2c5d5b29a6674cf77f1b4da2a404c3c86a5ebe8) Thanks [@DAreRodz](https://github.com/DAreRodz)! - Allow replacing signals with a new signal instance, e.g., `state.$prop = signal(1)`.

## 1.1.3

### Patch Changes

- [#9](https://github.com/luisherranz/deepsignal/pull/9) [`364c169`](https://github.com/luisherranz/deepsignal/commit/364c1696c759442b4360bbbc6bbe921d6ff66ef5) Thanks [@luisherranz](https://github.com/luisherranz)! - Fix `deepsignal/core` exports.

## 1.1.2

### Patch Changes

- [#6](https://github.com/luisherranz/deepsignal/pull/6) [`cd8c4a2`](https://github.com/luisherranz/deepsignal/commit/cd8c4a2717efe30305bfaf13305e193c93d85e1c) Thanks [@luisherranz](https://github.com/luisherranz)! - Support regular functions inside the deep signal.

## 1.1.1

### Patch Changes

- [#3](https://github.com/luisherranz/deepsignal/pull/3) [`2044911`](https://github.com/luisherranz/deepsignal/commit/20449118e631e5b3129f1ae1ba1b81eb0fcf78d0) Thanks [@luisherranz](https://github.com/luisherranz)! - TypeScript: add types for the array methods (map, filter, etc).

## 1.1.0

### Minor Changes

- [#1](https://github.com/luisherranz/deepsignal/pull/1) [`4efbf1c`](https://github.com/luisherranz/deepsignal/commit/4efbf1ccc3b089e6a6722de1e58b28e91d540517) Thanks [@luisherranz](https://github.com/luisherranz)! - Switch from `state.$prop` to `peek(state, "prop")`.

## 1.0.0

### Major Changes

- [#1](https://github.com/luisherranz/deepsignal/pull/1) [`b09a3f3`](https://github.com/luisherranz/deepsignal/commit/b09a3f3c911da103ef3179e6d5509035e3e3909b) Thanks [@luisherranz](https://github.com/luisherranz)! - Initial version.
