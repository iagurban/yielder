# yielder [![Build Status](https://travis-ci.org/iagurban/yielder.svg?branch=master)](https://travis-ci.org/iagurban/yielder) [![codecov](https://codecov.io/gh/iagurban/react-linking-model/branch/master/graph/badge.svg)](https://codecov.io/gh/iagurban/yielder)
> Turns various stuff to coroutines so you can write solid and linear asynchronous code

## Install

```shell
npm install yielder
```
- Generator becomes a promise which executes generator and turns yielded 'yieldables' to other promises and continues execution following to their resolving
- Array or object can become composite promise which usually resolves to collection of values (where original yieldables already resolved to their values). That behavion customisable and optional: you can make specific objects yieldable (see 'toPromise' option) or disable default handlers of some types (see 'yieldables' option)

## API

#### `yielder(yieldable): Promise`
> Default yielder function created by `yielder.create({})`.

#### `yielder.create(opts): yielder`
> Creates yielder-function configured according to `opts`.

`opts` can have following properties:
  
  | Option | Type | Default | Description |
  | --- | --- | --- | --- |
  | **strict** | _bool_ | `true` | If `true`, yielding non-yieldable types is prohibited and breaks execution with rejecting resulting promise |
  | **strictPromises** | _bool_ | `false` | Default yieldables-detector will treat object with `.then()` method as promise only when `.catch()` method also exists. Try set it to `true` if your objects has `.next()` method and improperly used by yielder like promise |
  | **toPromise** | _fn_&nbsp;\|&nbsp;_null_ | `null` |
  | yieldables.**array**       | _bool_ | `true`  | Native arrays are composite yieldables
  | yieldables.**iterable**    | _bool_ | `false` | Any objects with `[Symbol.iterator]()` method are composite yieldables
  | yieldables.**plainObject** | _bool_ | `true`  | Object's direct instances are keyed composite yieldables
  | yieldables.**object**      | _bool_ | `false` | Any objects are keyed composite yieldables
  
Keyed composite yieldable uses only own object's properties to collect results.

##### _returns_ `function(yieldable): Promise`
> Starts execution of `yieldable` and returns promise, which will be resolved with result of `yieldable`'s execution or rejects with error thrown during it.
