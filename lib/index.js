(function(){
  var _, isGenerator, GeneratorFunction, defaultYieldables, defaultOptions, UnsupportedYieldable, create;
  _ = require('lodash');
  isGenerator = function(obj){
    return 'function' === typeof obj.next && 'function' === typeof obj['throw'];
  };
  /* istanbul ignore next */
  GeneratorFunction = Object.getPrototypeOf(function*(){}).constructor;
  defaultYieldables = {
    plainObject: true,
    array: true,
    iterable: true,
    object: false
  };
  defaultOptions = {
    strict: true,
    strictPromises: false
  };
  UnsupportedYieldable = (function(){
    UnsupportedYieldable.displayName = 'UnsupportedYieldable';
    var prototype = UnsupportedYieldable.prototype, constructor = UnsupportedYieldable;
    function UnsupportedYieldable(){
      TypeError.constructor.call(this);
      this.message = arguments[0];
      this.stack = new Error().stack;
    }
    UnsupportedYieldable.prototype = new TypeError();
    return UnsupportedYieldable;
  }());
  create = function(options){
    var yieldables, strict, isPromise, toPromise, main;
    options == null && (options = {});
    yieldables = _.defaults(_.assign({}, options.yieldables), defaultYieldables);
    options = _.defaults(_.omit(options, ['yieldables']), defaultOptions);
    strict = Boolean(options.strict);
    isPromise = options.strictPromises
      ? function(obj){
        return 'function' === typeof obj.then && 'function' === typeof obj['catch'];
      }
      : function(obj){
        return 'function' === typeof obj.then;
      };
    toPromise = (function(){
      var object, iterable, generator, async, promise, unknown;
      object = function(obj){
        return new Promise(function(resolve, reject){
          var waiting, results;
          waiting = 0;
          results = {};
          _.forOwn(obj, function(v, k){
            var that;
            switch (false) {
            case !(that = toPromise(v)):
              ++waiting;
              that['catch'](reject).then(function(arg$){
                results[k] = arg$;
                if (--waiting < 1) {
                  return resolve(results);
                }
              });
              break;
            default:
              results[k] = v;
            }
          });
          if (waiting < 1) {
            resolve(results);
          }
        });
      };
      iterable = function(iterable){
        var iterator;
        iterator = iterable[Symbol.iterator]();
        return new Promise(function(resolve, reject){
          var results, waiting, t, that;
          results = [];
          waiting = 0;
          while (!(t = iterator.next()).done) {
            switch (false) {
            case !(that = toPromise(t.value)):
              ++waiting;
              (fn$.call(this, results.length));
              results.push(null);
              break;
            default:
              results.push(t.value);
            }
          }
          if (waiting < 1) {
            resolve(results);
          }
          function fn$(idx){
            that['catch'](reject).then(function(arg$){
              results[idx] = arg$;
              if (--waiting < 1) {
                resolve(results);
              }
            });
          }
        });
      };
      generator = function(obj){
        return main(obj);
      };
      async = function(fn){
        return new Promise(function(resolve, reject){
          fn(function(){
            if (arguments[0]) {
              reject(arguments[0]);
            } else {
              resolve(arguments[1]);
            }
          });
        });
      };
      promise = _.identity;
      unknown = function(o){
        var this$ = this;
        if (!strict) {
          return new Promise((function(it){
            return it(o);
          }));
        }
      };
      return function(fallback){
        switch (false) {
        case !options.toPromise:
          return function(it){
            var x$;
            x$ = options.toPromise(it, fallback);
            if (x$ != null && !isPromise(x$)) {
              throw new Error('');
            }
            return x$;
          };
        default:
          return fallback;
        }
      }(
      function(it){
        return _.assign(it, {
          object: object,
          iterable: iterable,
          generator: generator,
          async: async,
          unknown: unknown,
          promise: promise
        });
      }(
      function(select){
        return function(o){
          var ref$;
          if (o == null) {
            return o;
          } else {
            return ((ref$ = select(o)) != null ? ref$ : unknown)(o);
          }
        };
      }(
      function(o){
        switch (typeof o) {
        case 'function':
          return (function(){
            switch (false) {
            case !(o instanceof GeneratorFunction):
              return generator;
            default:
              return async;
            }
          }());
        case 'object':
          return (function(){
            switch (false) {
            case !isPromise(o):
              return promise;
            case !isGenerator(o):
              return generator;
            case !(yieldables.array && Array.isArray(o)):
              return iterable;
            case !(yieldables.iterable && Symbol.iterator in o):
              return iterable;
            case !(yieldables.plainObject && Object === o.constructor):
              return object;
            case !yieldables.object:
              return object;
            }
          }());
        }
      })));
    }.call(this));
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
          case value != null:
            return onResolved(value);
          case !(that = toPromise(value)):
            return that.then(onResolved, onFulfilled.bind(null, 'throw'));
          default:
            return onFulfilled('throw', new UnsupportedYieldable("non yieldable: " + value));
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
