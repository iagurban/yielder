require! {
  './index': yielder

  lodash: _
  chai: {expect}:chai
}

chai.should!
chai.use require "chai-as-promised"

nostrict-yielder = yielder.create do
  strict: false

# yielder = yielder.create do
#   strict: false

describe 'main', (___) ->
  it 'generator function to promise', -> Promise.all [
    yielder ->* yield 1
    .should.be.rejected

    yielder ->* 1
    .should.eventually.equal 1

    yielder ((arg) ->* arg), 123
    .should.eventually.equal 123

    nostrict-yielder ->* yield 2
    .should.eventually.equal 2

    nostrict-yielder ->* 2
    .should.eventually.equal 2

    nostrict-yielder ->*
      done = false
      yield {
        next: ->
          done: true, value: 1
        throw: ->
          done: true
          value: new Error 'err'
      }
    .should.eventually.equal 1
  ]

  it 'promise to promise', -> Promise.all [
    yielder new Promise -> &0 1
    .should.eventually.equal 1
  ]

  it 'iterable to promise', -> Promise.all [
    yielder ~>* yield [
      ~>* 3
      ~>* 4
      5
    ]
    .should.eventually.eql [3, 4, 5]
  ]

  it 'async to promise', -> Promise.all [
    yielder ~>* yield (next) -> next null, 5
    .should.eventually.eql 5

    yielder ~>* yield (next) -> next (new Error), 123
    .should.be.rejected
  ]

  it 'object to promise', -> Promise.all [
    yielder ~>* yield {
      a: ~>* 4
      b: 5
      c: new Promise -> &0 2
    }
    .should.eventually.eql a: 4, b: 5, c: 2

    yielder ->* yield a: 1, b: 2
    .should.eventually.eql a: 1, b: 2

    yielder ->* yield ((Object.create null) <<< a: 1, b: 2)
    .should.be.rejected

    (yielder.create strict-objects: false) (->* yield ((Object.create null) <<< a: 1, b: 2))
    .should.eventually.eql a: 1, b: 2
  ]

  it 'converter', -> Promise.all [
    do ->
      class CustomType
      yielder2 = yielder.create to-promise: ((o, fallback) -> (o instanceof CustomType) and (fallback [1 2 3]) or fallback o)

      yielder2 ->*
        yield {
          a: new CustomType
          a1: ->* new CustomType
          a2: ->* yield new CustomType
          b: 5
          c: new Promise -> &0 2
        }
      .should.eventually.eql a: [1 2 3], a1: {}, a2: [1 2 3], b: 5, c: 2

    do ->
      class CustomType
      class CustomType2
      yielder2 = yielder.create to-promise: (o, fallback) ->
        | o instanceof CustomType => 1
        | o instanceof CustomType2 => fallback [1 2 3]
        | _ => fallback o

      yielder2 ->* yield [1, 2, new CustomType]
      .should.be.rejected

      yielder2 ->* yield [1, 2, new CustomType2]
      .should.eventually.eql [1 2 [1 2 3]]

      yielder2 ->* yield [1 2 3]
      .should.eventually.eql [1 2 3]
  ]


  # it 'numeric', !->
  #   model = new LinkingModel do
  #     test: 1

  #   with model.links.test
  #     expect (_.size ..) .equal 2
  #     expect ..value .equal 1
  #     expect ..on-change .to.be.instanceof Function
  #     ..on-change 5

  #   expect model.links.test.value .equal 5

  # it 'changing definition', !->
  #   in-passed = false
  #   out-passed = false

  #   model = new LinkingModel do
  #     test:
  #       i: value-name: ->
  #         in-passed := true
  #         it + 1
  #       o: on-change-name: ->
  #         out-passed := true
  #         it + 1
  #       d: 123

  #   with model.links.test
  #     expect (_.size ..) .equal 2
  #     expect ..value-name .equal 124
  #     expect ..on-change-name .to.be.instanceof Function
  #     ..on-change-name 5

  #   expect (model.data.get \test) .equal 6
  #   expect model.links.test.value-name .equal 7

  #   model.links.test = 20
  #   expect (model.data.get \test) .equal 20
  #   expect model.links.test.value-name .equal 21

  #   expect in-passed .equal true
  #   expect out-passed .equal true

  # it 'no-out', !->
  #   model = new LinkingModel do
  #     test:
  #       i: value: -> it + 1
  #       d: 123

  #   with model.links.test
  #     expect (_.size ..) .equal 1
  #     expect (model.data.get \test) .equal 123
  #     expect ..value .equal 124

  # it 'no-in-out', !->
  #   model = new LinkingModel do
  #     test:
  #       d: 123

  #   with model.links.test
  #     expect (_.size ..) .equal 0

  # it 'native', !->
  #   model = new LinkingModel do
  #     test: LinkingModel.native

  #   with model.links.test.extend type: \text
  #     expect (_.size ..) .equal 3
  #     expect ..type .equal 'text'
  #     expect ..value .equal ''
  #     expect ..on-change .to.be.instanceof Function
  #     ..on-change target: value: 'abc'

  #   expect model.links.test.type? .equal false

  #   expect (model.data.get \test) .equal 'abc'
  #   expect model.links.test.value .equal 'abc'
  #   expect ->
  #     model.links.test.on-change null
  #   .to.throw!

  # it 'subscription', !->
  #   model = new LinkingModel do
  #     test: 1

  #   sub-called = false
  #   unsub = model.sub !->
  #     sub-called := true
  #     expect (it.get \test) .equal 10

  #   sub-called := false
  #   model.links.test.on-change 10
  #   expect sub-called .equal true

  #   sub-called := false
  #   model.links.test.on-change 10
  #   expect sub-called .equal false

  #   unsub!

  #   expect model._ob_observers.size .equal 0

  # it 'many subscriptions', !->
  #   model = new LinkingModel do
  #     test: 1

  #   unsub1 = model.sub !->
  #   model._last-uuid = 0 # simulate overflow
  #   unsub2 = model.sub !->

  #   unsub1!
  #   unsub2!

  #   expect model._ob_observers.size .equal 0
