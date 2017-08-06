(function(){
  var _, isPromise, isGenerator, GeneratorFunction, isGeneratorFunction, defaultYieldables, UnsupportedYieldable, create;
  _ = require('lodash');
  isPromise = function(obj){
    return 'function' === typeof obj.then;
  };
  isGenerator = function(obj){
    return 'function' === typeof obj.next && 'function' === typeof obj['throw'];
  };
  /* istanbul ignore next */
  GeneratorFunction = Object.getPrototypeOf(function*(){}).constructor;
  isGeneratorFunction = function(it){
    return it instanceof GeneratorFunction || isGenerator(it);
  };
  defaultYieldables = {
    number: false,
    string: false,
    plainObject: true,
    array: true,
    iterable: true,
    object: false
  };
  UnsupportedYieldable = (function(){
    UnsupportedYieldable.displayName = 'UnsupportedYieldable';
    var prototype = UnsupportedYieldable.prototype, constructor = UnsupportedYieldable;
    function UnsupportedYieldable(){
      Error.constructor.call(this);
      this.message = arguments[0];
      this.stack = new Error().stack;
    }
    UnsupportedYieldable.prototype = new Error();
    return UnsupportedYieldable;
  }());
  create = function(options){
    var yieldables, ref$, converters, defineStep, unsupported, toPromiseSteps, toPromise, iteratorPromise, main;
    options == null && (options = {});
    yieldables = (ref$ = options.yieldables) != null
      ? ref$
      : {};
    _.defaults(yieldables, defaultYieldables);
    converters = {
      object: function(obj){
        return new Promise(function(resolve, reject){
          var waiting, results;
          waiting = 0;
          results = {};
          _.forOwn(obj, function(v, k){
            var promise, e;
            promise = (function(){
              try {
                return toPromise(v);
              } catch (e$) {
                e = e$;
                if (!(e instanceof UnsupportedYieldable)) {
                  throw null;
                }
                return null;
              }
            }());
            if (promise) {
              ++waiting;
              return promise.then(function(arg$){
                results[k] = arg$;
                if (--waiting < 1) {
                  return resolve(results);
                }
              })['catch'](reject);
            } else {
              return results[k] = v;
            }
          });
          if (waiting < 1) {
            resolve(results);
          }
        });
      },
      iterable: function(iterable){
        return iteratorPromise(iterable[Symbol.iterator]());
      },
      generator: function(obj){
        return main(obj);
      },
      async: function(fn){
        return new Promise(function(resolve, reject){
          fn(function(err, r){
            if (err) {
              reject(err);
            } else {
              resolve(r);
            }
          });
        });
      },
      promise: _.identity
    };
    defineStep = function(predicate, normal, isAllowed, message){
      return [
        predicate, isAllowed
          ? normal
          : function(){
            throw new UnsupportedYieldable(message);
          }
      ];
    };
    unsupported = function(){
      return null;
    };
    toPromiseSteps = [
      [
        function(it){
          return !it;
        }, unsupported
      ], defineStep(_.isNumber, unsupported, yieldables.number, 'yielding numbers is forbidden'), defineStep(_.isString, unsupported, yieldables.number, 'yielding strings is forbidden'), defineStep(isPromise, function(it){
        return it;
      }, true), defineStep(isGeneratorFunction, converters.generator, true), defineStep(function(it){
        return 'function' === typeof it;
      }, converters.async, true), defineStep(Array.isArray, converters.iterable, yieldables.array || yieldables.iterable, 'yielding arrays is forbidden'), defineStep(function(it){
        return Symbol.iterator in it;
      }, converters.iterable, yieldables.iterable, 'yielding iterables is forbidden'), defineStep(function(it){
        return Object === it.constructor;
      }, converters.object, yieldables.plainObject, 'yielding any objects is forbidden'), defineStep(_.isObject, converters.object, yieldables.object, 'yielding non-Object objects is forbidden')
    ];
    toPromise = _(_.assign(function(obj){
      var i$, ref$, len$, ref1$, predicate, processor;
      for (i$ = 0, len$ = (ref$ = toPromiseSteps).length; i$ < len$; ++i$) {
        ref1$ = ref$[i$], predicate = ref1$[0], processor = ref1$[1];
        if (predicate(obj)) {
          return processor(obj);
        }
      }
    }, converters)).thru(function(orig){
      return options.toPromise && function(it){
        return options.toPromise(it, orig);
      } || orig;
    }).thru(function(orig){
      return function(o){
        var x$;
        x$ = orig(o);
        if (x$ != null && ('function' !== typeof x$.then || 'function' !== typeof x$['catch'])) {
          throw new Error('');
        }
        return x$;
      };
    }).value();
    iteratorPromise = function(iterator){
      return new Promise(function(resolve, reject){
        var results, waiting, t, promise, e;
        results = [];
        waiting = 0;
        while (!(t = iterator.next()).done) {
          promise = (fn$());
          if (promise) {
            (fn1$.call(this, results.length));
          } else {
            results.push(t.value);
          }
        }
        if (waiting < 1) {
          resolve(results);
        }
        function fn$(){
          try {
            return toPromise(t.value);
          } catch (e$) {
            e = e$;
            if (!(e instanceof UnsupportedYieldable)) {
              throw e;
            }
            return null;
          }
        }
        function fn1$(idx){
          results.push(null);
          ++waiting;
          promise.then(function(arg$){
            results[idx] = arg$;
            if (--waiting < 1) {
              resolve(results);
            }
          })['catch'](reject);
        }
      });
    };
    return main = function(gen){
      var args, res$, i$, to$;
      res$ = [];
      for (i$ = 1, to$ = arguments.length; i$ < to$; ++i$) {
        res$.push(arguments[i$]);
      }
      args = res$;
      return new Promise(function(resolve, reject){
        var onFulfilled, onResolved;
        if (typeof gen === 'function') {
          gen = gen.apply(null, args);
        }
        if (!gen || typeof gen.next !== 'function') {
          return resolve(gen);
        }
        onFulfilled = function(method, res){
          var ref$, done, value, e, that;
          try {
            ref$ = gen[method](res), done = ref$.done, value = ref$.value;
          } catch (e$) {
            e = e$;
            return reject(e);
          }
          switch (false) {
          case !done:
            return resolve(value);
          case !(that = toPromise(value)):
            return that.then(onResolved, onFulfilled.bind(null, 'throw'));
          default:
            return onResolved(value);
          }
        };
        (onResolved = onFulfilled.bind(null, 'next'))();
      });
    };
  };
  module.exports = _.thru(create(), function(orig){
    return _.assign(orig, {
      create: create
    });
  });
}).call(this);
