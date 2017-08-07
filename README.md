# yielder [![Build Status](https://travis-ci.org/iagurban/yielder.svg?branch=master)](https://travis-ci.org/iagurban/yielder) [![codecov](https://codecov.io/gh/iagurban/react-linking-model/branch/master/graph/badge.svg)](https://codecov.io/gh/iagurban/yielder)
> Turns various stuff to coroutines so you can write solid and linear asynchronous code

## Install

```shell
npm install yielder
```

- Generator becomes a promise which turns yielded 'yieldables' to other promises and continues execution following to their resolving
- Array or object can become composite promise which usually resolves to collection of values (where original yieldables already resolved to their values). That behavion customisable and optional: you can make specific objects yieldable (see 'toPromise' option) or disable default handlers of some types (see 'yieldables' option)

## API

### `yielder(yieldable): Promise`
### `yielder.create(opts): yielder`
