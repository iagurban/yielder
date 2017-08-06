(function(){
  var _, isPromise, isGenerator, GeneratorFunction, isGeneratorFunction, create;
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
  create = function(options){
    var nostrictMode, nostrictObjectsMode, converters, toPromise, iteratorPromise, onNonPromise, main;
    options == null && (options = {});
    nostrictMode = 'strict' in options && !options.strict;
    nostrictObjectsMode = 'strictObjects' in options && !options.strictObjects;
    converters = {
      object: function(obj){
        return new Promise(function(resolve, reject){
          var waiting, results;
          waiting = 0;
          results = {};
          _.forOwn(obj, function(v, k){
            var promise;
            switch (false) {
            case !(promise = toPromise(v)):
              ++waiting;
              return promise.then(function(arg$){
                results[k] = arg$;
                if (--waiting < 1) {
                  return resolve(results);
                }
              })['catch'](reject);
            default:
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
    toPromise = _.thru(_.assign(function(obj){
      var this$ = this;
      switch (false) {
      case !(!obj || _.some([_.isNumber, _.isString], (function(it){
        return it(obj);
      }))):
        return null;
      case !isPromise(obj):
        return obj;
      case !isGeneratorFunction(obj):
        return converters.generator(obj);
      case 'function' !== typeof obj:
        return converters.async(obj);
      case !(Symbol.iterator in obj):
        return converters.iterable(obj);
      case !(nostrictObjectsMode || Object === obj.constructor):
        return converters.object(obj);
      default:
        return null;
      }
    }, converters), function(orig){
      return options.toPromise && function(it){
        return options.toPromise(it, orig);
      } || orig;
    });
    toPromise = (function(orig){
      return function(o){
        var x$;
        x$ = orig(o);
        if (x$ != null && ('function' !== typeof x$.then || 'function' !== typeof x$['catch'])) {
          throw new Error('');
        }
        return x$;
      };
    }.call(this, toPromise));
    iteratorPromise = function(iterator){
      return new Promise(function(resolve, reject){
        var results, waiting, t, promise;
        results = [];
        waiting = 0;
        while (!(t = iterator.next()).done) {
          if (promise = toPromise(t.value)) {
            (fn$.call(this, results.length));
          } else {
            results.push(t.value);
          }
        }
        if (waiting < 1) {
          resolve(results);
        }
        function fn$(idx){
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
    onNonPromise = (function(){
      switch (false) {
      case !nostrictMode:
        return function(){
          return arguments[1](arguments[0]);
        };
      default:
        return function(){
          var e;
          return arguments[2](new TypeError("Yielded non-yieldable object: \"" + (function(args$){
            try {
              return String(args$[0]);
            } catch (e$) {
              e = e$;
              return "<" + typeof args$[0] + ">";
            }
          }(arguments)) + "\"\ (see 'selectConverter' option)"));
        };
      }
    }());
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
          var ref$, done, value, e, onRejected, that;
          try {
            ref$ = gen[method](res), done = ref$.done, value = ref$.value;
          } catch (e$) {
            e = e$;
            return reject(e);
          }
          switch (false) {
          case !done:
            return resolve(value);
          default:
            onRejected = onFulfilled.bind(null, 'throw');
            switch (false) {
            case !(that = toPromise(value)):
              return that.then(onResolved, onRejected);
            default:
              return onNonPromise(value, onResolved, onRejected);
            }
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
