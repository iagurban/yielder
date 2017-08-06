(function(){
  var yielder, _, chai, expect, nostrictYielder;
  yielder = require('./index');
  _ = require('lodash');
  chai = require('chai'), expect = chai.expect;
  chai.should();
  chai.use(require("chai-as-promised"));
  nostrictYielder = yielder.create({
    strict: false
  });
  describe('main', function(___){
    it('generator function to promise', function(){
      return Promise.all([
        yielder(function*(){
          return (yield 1);
        }).should.be.rejected, yielder(function*(){
          return 1;
        }).should.eventually.equal(1), yielder(function*(arg){
          return arg;
        }, 123).should.eventually.equal(123), nostrictYielder(function*(){
          return (yield 2);
        }).should.eventually.equal(2), nostrictYielder(function*(){
          return 2;
        }).should.eventually.equal(2), nostrictYielder(function*(){
          var done;
          done = false;
          return (yield {
            next: function(){
              return {
                done: true,
                value: 1
              };
            },
            'throw': function(){
              return {
                done: true,
                value: new Error('err')
              };
            }
          });
        }).should.eventually.equal(1)
      ]);
    });
    it('promise to promise', function(){
      return Promise.all([yielder(new Promise(function(){
        return arguments[0](1);
      })).should.eventually.equal(1)]);
    });
    it('iterable to promise', function(){
      var this$ = this;
      return Promise.all([yielder(function*(){
        return (yield [
          function*(){
            return 3;
          }, function*(){
            return 4;
          }, 5
        ]);
      }).should.eventually.eql([3, 4, 5])]);
    });
    it('async to promise', function(){
      var this$ = this;
      return Promise.all([
        yielder(function*(){
          return (yield function(next){
            return next(null, 5);
          });
        }).should.eventually.eql(5), yielder(function*(){
          return (yield function(next){
            return next(new Error, 123);
          });
        }).should.be.rejected
      ]);
    });
    it('object to promise', function(){
      var this$ = this;
      return Promise.all([
        yielder(function*(){
          return (yield {
            a: function*(){
              return 4;
            },
            b: 5,
            c: new Promise(function(){
              return arguments[0](2);
            })
          });
        }).should.eventually.eql({
          a: 4,
          b: 5,
          c: 2
        }), yielder(function*(){
          return (yield {
            a: 1,
            b: 2
          });
        }).should.eventually.eql({
          a: 1,
          b: 2
        }), yielder(function*(){
          var ref$;
          return (yield (ref$ = Object.create(null), ref$.a = 1, ref$.b = 2, ref$));
        }).should.be.rejected, yielder.create({
          strictObjects: false
        })(function*(){
          var ref$;
          return (yield (ref$ = Object.create(null), ref$.a = 1, ref$.b = 2, ref$));
        }).should.eventually.eql({
          a: 1,
          b: 2
        })
      ]);
    });
    return it('converter', function(){
      return Promise.all([
        function(){
          var CustomType, yielder2;
          CustomType = (function(){
            CustomType.displayName = 'CustomType';
            var prototype = CustomType.prototype, constructor = CustomType;
            function CustomType(){}
            return CustomType;
          }());
          yielder2 = yielder.create({
            toPromise: function(o, fallback){
              return o instanceof CustomType && fallback([1, 2, 3]) || fallback(o);
            }
          });
          return yielder2(function*(){
            return (yield {
              a: new CustomType,
              a1: function*(){
                return new CustomType;
              },
              a2: function*(){
                return (yield new CustomType);
              },
              b: 5,
              c: new Promise(function(){
                return arguments[0](2);
              })
            });
          }).should.eventually.eql({
            a: [1, 2, 3],
            a1: {},
            a2: [1, 2, 3],
            b: 5,
            c: 2
          });
        }(), function(){
          var CustomType, CustomType2, yielder2;
          CustomType = (function(){
            CustomType.displayName = 'CustomType';
            var prototype = CustomType.prototype, constructor = CustomType;
            function CustomType(){}
            return CustomType;
          }());
          CustomType2 = (function(){
            CustomType2.displayName = 'CustomType2';
            var prototype = CustomType2.prototype, constructor = CustomType2;
            function CustomType2(){}
            return CustomType2;
          }());
          yielder2 = yielder.create({
            toPromise: function(o, fallback){
              switch (false) {
              case !(o instanceof CustomType):
                return 1;
              case !(o instanceof CustomType2):
                return fallback([1, 2, 3]);
              default:
                return fallback(o);
              }
            }
          });
          yielder2(function*(){
            return (yield [1, 2, new CustomType]);
          }).should.be.rejected;
          yielder2(function*(){
            return (yield [1, 2, new CustomType2]);
          }).should.eventually.eql([1, 2, [1, 2, 3]]);
          return yielder2(function*(){
            return (yield [1, 2, 3]);
          }).should.eventually.eql([1, 2, 3]);
        }()
      ]);
    });
  });
}).call(this);
