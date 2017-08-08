# yielder [![Build Status](https://travis-ci.org/iagurban/yielder.svg?branch=master)](https://travis-ci.org/iagurban/yielder) [![codecov](https://codecov.io/gh/iagurban/react-linking-model/branch/master/graph/badge.svg)](https://codecov.io/gh/iagurban/yielder)
> Turns various stuff to coroutines so you can write solid and linear asynchronous code

## Install

```shell
npm install yielder
```
- Generator becomes a promise which executes generator and turns yielded 'yieldables' to other promises and continues execution following to their resolving
- Array or object can become composite promise which usually resolves to collection of values (where original yieldables already resolved to their values). That behavion customisable and optional: you can make specific objects yieldable (see 'toPromise' option) or disable default handlers of some types (see 'yieldables' option)

## Examples

Use it as follows

```javascript
yielder = require('yielder');

// yielder is a function
// yielder.create is a function for creating differently configured yielder

yielder(function*(){
  return (yield [
    function*() { return (yield new Promise((resolve) => resolve(3))); },
    
    function*() { return 4; },
    
    5,

    new Promise(function(resolve){ return setTimeout(((__) => resolve(1)), 1000); }),

    function(next) { return next(null, 5); }
  ]);
}).then(function(result){
   // result => [3, 4, 5, 1, 5]
   // (because children of yielded [] will be also yielded)
});
```

Object is yieldable if yielder know how to create promise from it (or for job related to him). You can turn default rules on or off or fully override it by set `toPromise` option to function which accepts `object` it needs to convert and `fallback` – default conversion function.

```javascript
TestIterable = (function(){
  TestIterable.prototype[Symbol.iterator] = function() { return [][Symbol.iterator](); };
  function TestIterable(){}
  return TestIterable;
}());

yilder2 = yielder.create({ yieldables: { array: true, iterable: true } });

yilder2(function*() { return (yield new TestIterable); }); // ok
yilder2(function*(){ return (yield []); }); // ok
yilder2(function*(){ return (yield immutable.List([1, 2, 3])); }); // ok

yilder3 = yielder.create({
  yieldables: { array: true, iterable: false },
  toPromise: function(o, fallback){
    if (immutable.isCollection(o)) {
      return fallback.iterable(o);
    } else {
      return fallback(o);
    }
  }
});

yilder3(function*() { return (yield new TestIterable); }); // fail
yilder3(function*() { return (yield []); }); // ok
yilder3(function*() { return (yield immutable.List([1, 2, 3])); }); // ok

```

Yieldable can be yielded or returned like non-yieldable.

```javascript
return (yield [function*() { return 4; }]) // => [4]
return ([function*() { return 4; }]) // => [GeneratorFunction]
```

You shouldn't yield non-yieldable ("synchronous") objects to always keep in mind breaking and continuous calls, so by default yielder will break execution in that cases to keep logic clean. If you see error about that, almost aways it means developer error.

You can allow yielding such objects by defining `strict` option. Internally it means that value will be converted to resolved promise. But again, aware of that. Try to understand generators instead.

```javascript
yielder(function*(){ return 1; }); // ok: 1
yielder(function*(){ return (yield 1); }); // fail: number is non-yieldable

yielder2 = yielder.create({ strict: false });

yielder2(function*(){ return 1; }); // ok: 1
yielder2(function*(){ return (yield 1); }); // ok: 1. well, just technically ok.
```

## API

#### `yielder(yieldable): Promise`
> Default yielder function created by `yielder.create({})`.
> Starts execution of `yieldable` and returns promise, which will be resolved with result of `yieldable`'s execution or rejects with error thrown during it.

#### `yielder.create(opts): yielder`
> Creates yielder-function configured according to `opts`.

`opts` can have following properties:
  
  | Option | Type | Default | Description |
  | --- | --- | --- | --- |
  | **strict** | _bool_ | `true` | If `true`, yielding non-yieldable types is prohibited and breaks execution with rejecting resulting promise |
  | **strictPromises** | _bool_ | `false` | Default yieldables-detector will treat object with `.then()` method as promise only when `.catch()` method also exists. Try set it to `true` if your objects has `.next()` method and improperly used by yielder like promise |
  | **toPromise** | _fn_&nbsp;\|&nbsp;_null_ | `null` | `function(object, fallback): Promise` returns promise or null if handling didn't succeed. `fallback` function is default conversion function for this yielder (according to options). Also it gives access to concrete converters (warning, no check for argument is performed): `fallback.async`, `fallback.generator`, `fallback.generatorFunction`, `fallback.iterable`, `fallback.object`.
  | yieldables.**array**       | _bool_ | `true`  | Native arrays are composite yieldables
  | yieldables.**iterable**    | _bool_ | `false` | Any objects with `[Symbol.iterator]()` method are composite yieldables
  | yieldables.**plainObject** | _bool_ | `true`  | Object's direct instances are keyed composite yieldables
  | yieldables.**object**      | _bool_ | `false` | Any objects are keyed composite yieldables
  
Keyed composite yieldable uses only own object's properties to collect results.

##### _returns_ `function(yieldable): Promise`
