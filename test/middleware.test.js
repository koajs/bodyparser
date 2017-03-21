/**!
 * koa-body-parser - test/middleware.test.js
 *
 * Copyright(c) 2014
 * MIT Licensed
 *
 * Authors:
 *   dead_horse <dead_horse@qq.com> (http://deadhorse.me)
 *   fengmk2 <m@fengmk2.com> (http://fengmk2.com)
 */

"use strict";

/**
 * Module dependencies.
 */

var path = require('path');
var request = require('supertest');
var koa = require('koa');
var should = require('should');
var bodyParser = require('../');

var fixtures = path.join(__dirname, 'fixtures');

describe('test/middleware.test.js', function () {
  describe('json body', function () {
    var app;
    beforeEach(function() {
      app = App();
    });

    it('should parse json body ok', function (done) {
      // should work when use body parser again
      app.use(bodyParser());

      app.use(function *() {
        this.request.body.should.eql( {foo: 'bar'} );
        this.request.rawBody.should.equal('{"foo":"bar"}');
        this.body = this.request.body;
      });
      request(app.listen())
      .post('/')
      .send({ foo: 'bar' })
      .expect({ foo: 'bar' }, done);
    });

    it('should parse json body with json-api headers ok', function (done) {
      // should work when use body parser again
      app.use(bodyParser());

      app.use(function *() {
        this.request.body.should.eql( {foo: 'bar'} );
        this.request.rawBody.should.equal('{"foo": "bar"}');
        this.body = this.request.body;
      });
      request(app.listen())
        .post('/')
        .set('Accept', 'application/vnd.api+json')
        .set('Content-type', 'application/vnd.api+json')
        .send('{"foo": "bar"}')
        .expect({ foo: 'bar' }, done);
    });

    it('should parse json patch', function (done) {
      var app = App();
      app.use(function *() {
        this.request.body.should.eql( [{op: 'add', path: '/foo', value: 'bar'}] );
        this.request.rawBody.should.equal('[{"op": "add", "path": "/foo", "value": "bar"}]');
        this.body = this.request.body;
      });
      request(app.listen())
        .patch('/')
        .set('Content-type', 'application/json-patch+json')
        .send('[{"op": "add", "path": "/foo", "value": "bar"}]')
        .expect([{op: 'add', path: '/foo', value: 'bar'}], done);
    });

    it('should json body reach the limit size', function (done) {
      var app = App({jsonLimit: 100});
      app.use(function *() {
        this.body = this.request.body;
      });
      request(app.listen())
      .post('/')
      .send(require(path.join(fixtures, 'raw.json')))
      .expect(413, done);
    });

    it('should json body error with string in strict mode', function (done) {
      var app = App({jsonLimit: 100});
      app.use(function *() {
        this.request.rawBody.should.equal('"invalid"');
        this.body = this.request.body;
      });
      request(app.listen())
      .post('/')
      .set('Content-type', 'application/json')
      .send('"invalid"')
      .expect(400, done);
    });

    it('should json body ok with string not in strict mode', function (done) {
      var app = App({jsonLimit: 100, strict: false});
      app.use(function *() {
        this.request.rawBody.should.equal('"valid"');
        this.body = this.request.body;
      });
      request(app.listen())
      .post('/')
      .set('Content-type', 'application/json')
      .send('"valid"')
      .expect(200)
      .expect('valid', done);
    });

    describe('opts.detectJSON', function () {
      it('should parse json body on /foo.json request', function (done) {
        var app = App({
          detectJSON: function (ctx) {
            return /\.json/i.test(ctx.path);
          }
        });

        app.use(function *() {
          this.request.body.should.eql( {foo: 'bar'} );
          this.request.rawBody.should.equal('{"foo":"bar"}');
          this.body = this.request.body;
        });

        request(app.listen())
        .post('/foo.json')
        .send(JSON.stringify({ foo: 'bar' }))
        .expect({ foo: 'bar' }, done);
      });

      it('should not parse json body on /foo request', function (done) {
        var app = App({
          detectJSON: function (ctx) {
            return /\.json/i.test(ctx.path);
          }
        });

        app.use(function *() {
          this.request.rawBody.should.equal('{"foo":"bar"}');
          this.body = this.request.body;
        });

        request(app.listen())
        .post('/foo')
        .send(JSON.stringify({ foo: 'bar' }))
        .expect({ '{"foo":"bar"}': '' }, done);
      });
    });
  });

  describe('form body', function () {
    var app = App();

    it('should parse form body ok', function (done) {
      app.use(function *() {
        this.request.body.should.eql( { foo: {bar: 'baz'} } );
        this.request.rawBody.should.equal('foo%5Bbar%5D=baz');
        this.body = this.request.body;
      });
      request(app.listen())
      .post('/')
      .type('form')
      .send({ foo: {bar: 'baz'} })
      .expect({ foo: {bar: 'baz'} }, done);
    });

    it('should parse form body reach the limit size', function (done) {
      var app = App({formLimit: 10});
      request(app.listen())
      .post('/')
      .type('form')
      .send({foo: {bar: 'bazzzzzzz'}})
      .expect(413, done);
    });
  });

  describe('text body', function () {
    it('should parse text body ok', function (done) {
      var app = App({
        enableTypes: ['text', 'json'],
      });
      app.use(function *() {
        this.request.body.should.equal('body');
        this.request.rawBody.should.equal('body');
        this.body = this.request.body;
      });
      request(app.listen())
      .post('/')
      .type('text')
      .send('body')
      .expect('body', done);
    });

    it('should not parse text body when disable', function (done) {
      var app = App();
      app.use(function *() {
        this.body = this.request.body;
      });
      request(app.listen())
      .post('/')
      .type('text')
      .send('body')
      .expect({}, done);
    });
  });

  describe('extent type', function () {
    it('should extent json ok', function (done) {
      var app = App({
        extendTypes: {
          json: 'application/x-javascript'
        }
      });
      app.use(function* () {
        this.body = this.request.body;
      });

      request(app.listen())
        .post('/')
        .type('application/x-javascript')
        .send(JSON.stringify({ foo: 'bar' }))
        .expect({ foo: 'bar' }, done);
    });

    it('should extent json with array ok', function (done) {
      var app = App({
        extendTypes: {
          json: ['application/x-javascript', 'application/y-javascript']
        }
      });
      app.use(function* () {
        this.body = this.request.body;
      });

      request(app.listen())
        .post('/')
        .type('application/x-javascript')
        .send(JSON.stringify({ foo: 'bar' }))
        .expect({ foo: 'bar' }, done);
    });
  });

  describe('enableTypes', function () {
    it('should disable json success', function (done) {
      var app = App({
        enableTypes: ['form'],
      });

      app.use(function *() {
        this.body = this.request.body;
      });
      request(app.listen())
      .post('/')
      .type('json')
      .send({ foo: 'bar' })
      .expect({}, done);
    });
  });

  describe('other type', function () {
    var app = App();

    it('should get body null', function (done) {
      app.use(function *() {
        this.request.body.should.eql( {} );
        this.body = this.request.body;
      });
      request(app.listen())
      .get('/')
      .expect({}, done);
    });
  });

  describe('onerror', function () {
    var app = App({
      onerror: function (err, ctx) {
        ctx.throw(422, 'custom parse error');
      }
    });

    it('should get custom error message', function (done) {
      app.use(function *() {
      });
      request(app.listen())
      .post('/')
      .send('test')
      .set('content-type', 'application/json')
      .expect(422)
      .expect('custom parse error', done);
    });
  });

  describe('disableBodyParser', () => {
    it('should not parse body when disableBodyParser set to true', function (done) {
      var app = koa();
      app.use(function *(next) {
        this.disableBodyParser = true;
        yield next;
      });
      app.use(bodyParser());
      app.use(function *() {
        (undefined === this.request.rawBody).should.equal(true);
        this.body = this.request.body ? 'parsed' : 'empty';
      });
      request(app.listen())
      .post('/')
      .send({foo: 'bar'})
      .set('content-type', 'application/json')
      .expect(200)
      .expect('empty', done);
    });
  });
});

function App(options) {
  var app = koa();
  app.use(bodyParser(options));
  return app;
}
