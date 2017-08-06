require! {
  lodash: _
}

is-promise = (obj) -> 'function' == typeof obj.then
is-generator = (obj) -> 'function' == typeof obj.next and 'function' == typeof obj.throw
/* istanbul ignore next */
GeneratorFunction = Object.get-prototype-of (!->*) .constructor
is-generator-function = -> (it instanceof GeneratorFunction) or is-generator it

create = (options ? {}) ->
  nostrict-mode = (\strict of options) and not options.strict
  nostrict-objects-mode = (\strictObjects of options) and not options.strict-objects

  converters =
    object: (obj) ->
      new Promise (resolve, reject) !->
        waiting = 0
        results = {}

        _.for-own obj, (v, k) ->
          | (promise = to-promise v)
            ++waiting
            promise
            .then (results[k]) -> resolve results if --waiting < 1
            .catch reject
          | _ => results[k] = v

        resolve results if waiting < 1

    iterable: (iterable) -> iterator-promise iterable[Symbol.iterator]!
    generator: (obj) -> main obj
    async: (fn) -> new Promise (resolve, reject) !-> fn (err, r) !-> if err => reject err else resolve r

    promise: _.identity

  to-promise = _.thru do
    _.assign do
      (obj) ->
        | !obj or _.some [_.is-number, _.is-string], (obj|>) => null
        | is-promise obj => obj
        | is-generator-function obj => converters.generator obj
        | 'function' == typeof obj => converters.async obj
        | Symbol.iterator of obj => converters.iterable obj
        | nostrict-objects-mode or Object == obj.constructor => converters.object obj
        | _ => null

      converters

    (orig) -> options.to-promise and (-> options.to-promise it, orig) or orig

  to-promise = let orig = to-promise
    (o) ->
      with orig o
        throw new Error '' if ..? and (('function' != typeof ..then) or ('function' != typeof ..catch))

  iterator-promise = (iterator) ->
    new Promise (resolve, reject) !->
      # todo: it can be big or even ifinite, add parallel-limit option (fetch next iter value when one of previous completed)
      results = []
      waiting = 0
      until (t = iterator.next!).done
        if promise = to-promise t.value
          let idx = results.length
            results.push null
            ++waiting
            promise
            .then (results[idx]) !-> resolve results if --waiting < 1
            .catch reject
        else
          results.push t.value
      resolve results if waiting < 1

  on-non-promise = switch
    | nostrict-mode => -> &1 &0
    | _ => -> &2 new TypeError "Yielded non-yieldable object: \"#{try (String &0) catch => "<#{typeof &0}>"}\"
                              \ (see 'selectConverter' option)"

  main = (gen, ...args) ->
    new Promise (resolve, reject) !->
      gen .= apply null, args if typeof gen == 'function'
      return resolve gen if !gen or typeof gen.next != 'function'

      on-fulfilled = (method, res) ->
        try
          {done, value} = gen[method] res
        catch e
          return reject e

        switch
        | done => resolve value
        | _
          on-rejected = on-fulfilled.bind null, 'throw'
          switch
          | to-promise value => that.then on-resolved, on-rejected
          | _ => on-non-promise value, on-resolved, on-rejected

      do (on-resolved = on-fulfilled.bind null, 'next')


module.exports = _.thru create!, (orig) -> _.assign orig,
  create: create
  # wrap:  (fn) -> (-> orig fn.apply null, &) <<< '__generatorFunction__': fn
