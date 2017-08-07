require! {
  './index': yielder

  lodash: _
  chai: {expect}:chai
}

chai.should!
chai.use require "chai-as-promised"

nostrict-yielder = yielder.create do
  strict: false
  yieldables:
    number: true
    string: true

# yielder = yielder.create do
#   strict: false

describe 'main', (___) ->
  it 'generator function to promise', -> Promise.all [
    yielder ->* yield 1
    .should.be.rejected

    yielder ->* 1
    .should.eventually.equal 1

    nostrict-yielder ->* yield 2
    .should.eventually.equal 2

    nostrict-yielder ->* 2
    .should.eventually.equal 2

    nostrict-yielder ->* yield 'a'
    .should.eventually.equal 'a'

    yielder ->* yield null
    .should.eventually.equal null

    nostrict-yielder ->*
      yield {
        next: ->
          done: true, value: 1657656578
        throw: ->
          done: true, value: new Error 'err'
      }

    .should.eventually.equal 1657656578
  ]

  it 'promise to promise', -> Promise.all [
    yielder new Promise -> &0 1
    .should.eventually.equal 1
  ]

  class TestIterable
    @::[Symbol.iterator] = -> [][Symbol.iterator]!

  it 'iterable to promise', -> Promise.all [
    yielder ~>* yield [
      ~>* 3
      ~>* 4
      5
    ]
    .should.eventually.eql [3, 4, 5]

    (yielder.create yieldables: {array: true, iterable: true}) (~>* yield new TestIterable)
    .should.eventually.eql []
  ]

  it 'array to promise', -> Promise.all [
    (yielder.create yieldables: {array: true, iterable: false}) (~>* yield [1 2 3])
    .should.eventually.eql [1 2 3]

    (yielder.create yieldables: {array: true, iterable: false}) (~>* yield new TestIterable)
    .should.be.rejected

    (yielder.create yieldables: {array: false, iterable: true}) (~>* yield [1 2 3 null])
    .should.eventually.eql [1 2 3 null]

    (yielder.create yieldables: {array: false, iterable: false}) (~>* yield [1 2 3])
    .should.be.rejected
  ]

  it 'async to promise', -> Promise.all [
    yielder ~>* yield (next) -> next null, 5
    .should.eventually.eql 5

    yielder ~>* yield (next) -> next (new Error), 123
    .should.be.rejected
  ]

  then-mock = (value) -> -> set-timeout (it.bind null, value), 0

  it 'strict-promises', -> Promise.all [
    yielder ~>* yield then: then-mock 123123
    .should.eventually.eql 123123

    (yielder.create strict-promises: true) (->* yield then: then-mock 123123)
    .should.be.rejected

    (yielder.create strict-promises: true) (->* yield then: (then-mock 123123), catch: ->)
    .should.eventually.eql 123123
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

    (yielder.create yieldables: object: true) (->* yield ((Object.create null) <<< a: 1, b: 2))
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

    do ->
      yielder2 = yielder.create to-promise: -> if _.is-number &0 => throw new Error 'something' else &1 &0

      yielder2 ->*
        yield {a: 1}
      .should.be.rejected
  ]
