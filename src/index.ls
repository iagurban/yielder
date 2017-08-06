require! {
  lodash: _
}

is-promise = (obj) -> 'function' == typeof obj.then
is-generator = (obj) -> 'function' == typeof obj.next and 'function' == typeof obj.throw
/* istanbul ignore next */
GeneratorFunction = Object.get-prototype-of (!->*) .constructor
is-generator-function = -> (it instanceof GeneratorFunction) or is-generator it

default-yieldables =
  number: false
  string: false
  plain-object: true
  array: true
  iterable: true
  object: false

class UnsupportedYieldable
  ->
    Error.constructor.call @
    @message = &0
    @stack = new Error! .stack

  @:: = new Error!

create = (options ? {}) ->
  {yieldables ? {}} = options

  _.defaults yieldables, default-yieldables

  converters =
    object: (obj) ->
      new Promise (resolve, reject) !->
        waiting = 0
        results = {}

        _.for-own obj, (v, k) ->
          promise =
            try
              to-promise v
            catch e
              throw unless e instanceof UnsupportedYieldable
              null

          if promise
            ++waiting
            promise
            .then (results[k]) -> resolve results if --waiting < 1
            .catch reject
          else results[k] = v

        resolve results if waiting < 1

    iterable: (iterable) -> iterator-promise iterable[Symbol.iterator]!
    generator: (obj) -> main obj
    async: (fn) -> new Promise (resolve, reject) !-> fn (err, r) !-> if err => reject err else resolve r

    promise: _.identity

  define-step = (predicate, normal, is-allowed, message) ->
    [
      predicate
      if is-allowed => normal else -> throw new UnsupportedYieldable message
    ]

  unsupported = -> null

  to-promise-steps = [
    [
      -> !it
      unsupported
    ]
    define-step do
      _.is-number
      unsupported
      yieldables.number
      'yielding numbers is forbidden'
    define-step do
      _.is-string
      unsupported
      yieldables.number
      'yielding strings is forbidden'
    define-step do
      is-promise
      -> it
      true
    define-step do
      is-generator-function
      converters.generator
      true
    define-step do
      -> 'function' == typeof it
      converters.async
      true
    define-step do
      Array.is-array
      converters.iterable
      yieldables.array or yieldables.iterable
      'yielding arrays is forbidden'
    define-step do
      -> Symbol.iterator of it
      converters.iterable
      yieldables.iterable
      'yielding iterables is forbidden'
    define-step do
      -> Object == it.constructor
      converters.object
      yieldables.plain-object
      'yielding any objects is forbidden'
    define-step do
      _.is-object
      converters.object
      yieldables.object
      'yielding non-Object objects is forbidden'
  ]

  to-promise =
    _ _.assign do
        (obj) ->
          for [predicate, processor] in to-promise-steps
            return processor obj if predicate obj
        converters

    .thru (orig) -> options.to-promise and (-> options.to-promise it, orig) or orig
    .thru (orig) ->
      (o) ->
        with orig o
          throw new Error '' if ..? and (('function' != typeof ..then) or ('function' != typeof ..catch))
    .value!

  iterator-promise = (iterator) ->
    new Promise (resolve, reject) !->
      # todo: it can be big or even ifinite, add parallel-limit option (fetch next iter value when one of previous completed)
      results = []
      waiting = 0
      until (t = iterator.next!).done
        promise =
          try
            to-promise t.value
          catch e
            throw e unless e instanceof UnsupportedYieldable
            null

        if promise
          let idx = results.length
            results.push null
            ++waiting
            promise
            .then (results[idx]) !-> resolve results if --waiting < 1
            .catch reject
        else
          results.push t.value
      resolve results if waiting < 1

  main = (gen, ...args) ->
    new Promise (resolve, reject) !->
      gen .= apply null, args if typeof gen == 'function'
      return resolve gen if !gen or typeof gen.next != 'function'

      on-fulfilled = (method, res) ->
        try
          {done, value} = gen[method] res
        catch e => return reject e

        switch
        | done => resolve value
        | to-promise value => that.then on-resolved, on-fulfilled.bind null, 'throw'
        | _ => on-resolved value

      do (on-resolved = on-fulfilled.bind null, 'next')


module.exports = _.thru create!, (orig) -> _.assign orig,
  create: create
