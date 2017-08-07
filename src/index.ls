require! {
  lodash: _
}

is-generator = (obj) -> ('function' == typeof obj.next) and ('function' == typeof obj.throw)
/* istanbul ignore next */
GeneratorFunction = Object.get-prototype-of (!->*) .constructor

default-yieldables =
  plain-object: true
  array: true
  iterable: true
  object: false

default-options =
  strict: true
  strict-promises: false

class UnsupportedYieldable
  ->
    TypeError.constructor.call @
    @message = &0
    @stack = new Error! .stack

  @:: = new TypeError!

create = (options ? {}) ->
  yieldables = _.defaults (_.assign {}, options.yieldables), default-yieldables
  options = _.defaults (_.omit options, <[yieldables]>), default-options

  strict = Boolean options.strict

  is-promise =
    if options.strict-promises
      (obj) -> ('function' == typeof obj.then) and ('function' == typeof obj['catch'])
    else
      (obj) -> 'function' == typeof obj.then

  to-promise = let
    object = (obj) -> new Promise (resolve, reject) !->
      waiting = 0
      results = {}

      _.for-own obj, (v, k) !->
        | to-promise v
          ++waiting
          that.catch reject .then (results[k]) -> resolve results if --waiting < 1
        | _ => results[k] = v

      resolve results if waiting < 1

    iterable = (iterable) ->
      iterator = iterable[Symbol.iterator]!
      new Promise (resolve, reject) !->
        # todo: it can be big or even ifinite, add parallel-limit option (fetch next iter value when one of previous completed)
        results = []
        waiting = 0
        until (t = iterator.next!).done
          switch
          | to-promise t.value
            ++waiting
            let idx = results.length
              that.catch reject .then (results[idx]) !-> resolve results if --waiting < 1
            results.push null
          | _ => results.push t.value
        resolve results if waiting < 1

    generator = (obj) -> new Promise (resolve, reject) !->
      on-fulfilled = (method, res) ->
        try
          {done, value} = obj[method] res
        catch e => return reject e

        switch
        | done => resolve value
        | not value? => on-resolved value
        | to-promise value => that.then on-resolved, on-fulfilled.bind null, 'throw'
        | _ => on-fulfilled 'throw', new UnsupportedYieldable "non yieldable: #{value}"

      do (on-resolved = on-fulfilled.bind null, 'next')
    generator-function = (obj) -> generator obj!
    async = (fn) -> new Promise (resolve, reject) !-> fn !-> if &0 => reject &0 else resolve &1
    promise = -> it
    unknown = strict and (-> null) or (o) -> new Promise (o |>)

    (o) ->
      switch (typeof o)
      | \function =>  o instanceof GeneratorFunction and generator-function or async

      | \object
        return switch
          | is-promise o => promise
          | is-generator o => generator

          | yieldables.array and Array.is-array o => iterable
          | yieldables.iterable and Symbol.iterator of o => iterable

          | yieldables.plain-object and Object == o.constructor => object
          | yieldables.object => object

    |> (select) -> (o) -> unless o? => o else ((select o) ? unknown) o
    |> -> _.assign it, {object, iterable, generator, async, unknown, promise}

    |> (fallback) ->
      | options.to-promise
        ->
          with options.to-promise it, fallback
            throw new Error '' if ..? and not is-promise ..
      | _ => fallback

  main-promisificationator = (yieldable) ->
    (to-promise yieldable) ? new Promise !-> &0 yieldable

module.exports = _.thru create!, (orig) -> _.assign orig,
  create: create
