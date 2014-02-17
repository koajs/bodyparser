var request = require('supertest')
var koa = require('koa')
var bodyParser = require('../');
var should = require('should');

describe('test/bodyparser.test.js', function () {
  describe('json body', function () {
    var app = App();

    it('should parse json body ok', function (done) {
      app.use(function *() {
        var body = yield this.bodyParser;
        body.should.eql({ foo: 'bar' });
        this.request.body.should.eql( {foo: 'bar'} );
        this.body = this.request.body;
      });
      request(app.listen())
      .post('/')
      .send({ foo: 'bar' })
      .expect({ foo: 'bar' }, done);
    });
  });

  describe('form body', function () {
    var app = App();

    it('should parse form body ok', function (done) {
      app.use(function *() {
        var body = yield this.request.bodyParser;
        body.should.eql({ foo: {bar: 'baz'} });
        this.request.body.should.eql( { foo: {bar: 'baz'} } );
        this.body = this.request.body;
      });
      request(app.listen())
      .post('/')
      .type('form')
      .send({ foo: {bar: 'baz'} })
      .expect({ foo: {bar: 'baz'} }, done);
    });
  });

  describe('other type', function () {
    var app = App();

    it('should get body null', function (done) {
      app.use(function *() {
        var body = yield this.bodyParser;
        should.not.exist(body);
        should.not.exist(this.request.body);
        done();
      });
      request(app.listen())
      .get('/')
      .end(function () {});
    });
  });
})

function App() {
  var app = koa();
  app.keys = ['a', 'b'];
  bodyParser(app);
  return app;
}
