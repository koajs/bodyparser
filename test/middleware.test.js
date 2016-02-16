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

const path = require('path');
const request = require('supertest');
const Koa = require('koa');
const should = require('should');
const bodyParser = require('../');

const fixtures = path.join(__dirname, 'fixtures');

describe('test/middleware.test.js', function () {
  describe('json body', function () {
    const app = App();

    it('should parse json body ok', function (done) {
      // should work when use body parser again
      app.use(bodyParser());

      app.use(function(ctx) {
        ctx.request.body.should.eql( {foo: 'bar'} );
        ctx.body = ctx.request.body;
      });
      request(app.listen())
      .post('/')
      .send({ foo: 'bar' })
      .expect({ foo: 'bar' }, done);
    });

    it('should parse json body with json-api headers ok', function (done) {
      // should work when use body parser again
      app.use(bodyParser());

      app.use(function(ctx) {
        ctx.request.body.should.eql( {foo: 'bar'} );
        ctx.body = ctx.request.body;
      });
      request(app.listen())
        .post('/')
        .set('Accept', 'application/vnd.api+json')
        .set('Content-type', 'application/vnd.api+json')
        .send('{"foo": "bar"}')
        .expect({ foo: 'bar' }, done);
    });

    it('should parse json patch', function (done) {
      const app = App();
      app.use(function(ctx) {
        ctx.request.body.should.eql( [{op: 'add', path: '/foo', value: 'bar'}] );
        ctx.body = ctx.request.body;
      });
      request(app.listen())
        .patch('/')
        .set('Content-type', 'application/json-patch+json')
        .send('[{"op": "add", "path": "/foo", "value": "bar"}]')
        .expect([{op: 'add', path: '/foo', value: 'bar'}], done);
    });

    it('should json body reach the limit size', function (done) {
      const app = App({jsonLimit: 100});
      app.use(function(ctx) {
        ctx.body = ctx.request.body;
      });
      request(app.listen())
      .post('/')
      .send(require(path.join(fixtures, 'raw.json')))
      .expect(413, done);
    });

    it('should json body error with string in strict mode', function (done) {
      const app = App({jsonLimit: 100});
      app.use(function(ctx) {
        ctx.body = ctx.request.body;
      });
      request(app.listen())
      .post('/')
      .set('Content-type', 'application/json')
      .send('"invalid"')
      .expect(400, done);
    });

    it('should json body ok with string not in strict mode', function (done) {
      const app = App({jsonLimit: 100, strict: false});
      app.use(function(ctx) {
        ctx.body = ctx.request.body;
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
        const app = App({
          detectJSON: function (ctx) {
            return /\.json/i.test(ctx.path);
          }
        });

        app.use(function(ctx) {
          ctx.request.body.should.eql( {foo: 'bar'} );
          ctx.body = ctx.request.body;
        });

        request(app.listen())
        .post('/foo.json')
        .send(JSON.stringify({ foo: 'bar' }))
        .expect({ foo: 'bar' }, done);
      });

      it('should not parse json body on /foo request', function (done) {
        const app = App({
          detectJSON: function (ctx) {
            return /\.json/i.test(ctx.path);
          }
        });

        app.use(function(ctx) {
          ctx.body = ctx.request.body;
        });

        request(app.listen())
        .post('/foo')
        .send(JSON.stringify({ foo: 'bar' }))
        .expect({ '{"foo":"bar"}': '' }, done);
      });
    });
  });

  describe('form body', function () {
    const app = App();

    it('should parse form body ok', function (done) {
      app.use(function(ctx) {
        ctx.request.body.should.eql( { foo: {bar: 'baz'} } );
        ctx.body = ctx.request.body;
      });
      request(app.listen())
      .post('/')
      .type('form')
      .send({ foo: {bar: 'baz'} })
      .expect({ foo: {bar: 'baz'} }, done);
    });

    it('should parse form body reach the limit size', function (done) {
      const app = App({formLimit: 10});
      request(app.listen())
      .post('/')
      .type('form')
      .send({foo: {bar: 'bazzzzzzz'}})
      .expect(413, done);
    });
  });

  describe('plain text body', function () {
    const app = App();

    it('should parse plain text body ok', function (done) {
      app.use(function(ctx) {
        ctx.request.body.should.eql( 'foo bar baz' );
        ctx.body = ctx.request.body;
      });
      request(app.listen())
      .post('/')
      .type('text/plain')
      .send('foo bar baz')
      .expect('foo bar baz', done);
    });

    it('should parse plain text body reach the limit size', function (done) {
      const app = App({formLimit: 10});
      request(app.listen())
      .post('/')
      .type('text/plain')
      .send('foo bar baz')
      .expect(413, done);
    });
  });

  describe('extent type', function () {
    it('should extent json ok', function (done) {
      const app = App({
        extendTypes: {
          json: 'application/x-javascript'
        }
      });
      app.use(function(ctx) {
        ctx.body = ctx.request.body;
      });

      request(app.listen())
        .post('/')
        .type('application/x-javascript')
        .send(JSON.stringify({ foo: 'bar' }))
        .expect({ foo: 'bar' }, done);
    });

    it('should extent json with array ok', function (done) {
      const app = App({
        extendTypes: {
          json: ['application/x-javascript', 'application/y-javascript']
        }
      });
      app.use(function(ctx) {
        ctx.body = ctx.request.body;
      });

      request(app.listen())
        .post('/')
        .type('application/x-javascript')
        .send(JSON.stringify({ foo: 'bar' }))
        .expect({ foo: 'bar' }, done);
    });

    it('should extend plain text ok', function (done) {
      const app = App({
        extendTypes: {
          text: 'text/plain2'
        }
      });
      app.use(function(ctx) {
        ctx.body = ctx.request.body;
      });

      request(app.listen())
        .post('/')
        .type('text/plain2')
        .send('foo bar baz')
        .expect('foo bar baz', done);
    });

    it('should extent plain text with array ok', function (done) {
      const app = App({
        extendTypes: {
          text: ['text/plain2', 'text/plain3']
        }
      });
      app.use(function(ctx) {
        ctx.body = ctx.request.body;
      });

      request(app.listen())
        .post('/')
        .type('text/plain3')
        .send('foo bar baz')
        .expect('foo bar baz', done);
    });

  });

  describe('other type', function () {
    const app = App();

    it('should get body null', function (done) {
      app.use(function(ctx) {
        ctx.request.body.should.eql( {} );
        done();
      });
      request(app.listen())
      .get('/')
      .end(function () {});
    });
  });

  describe('onerror', function () {
    const app = App({
      onerror: function (err, ctx) {
        ctx.throw('custom parse error', 422);
      }
    });

    it('should get custom error message', function (done) {
      app.use(function(ctx) {
      });
      request(app.listen())
      .post('/')
      .send('test')
      .set('content-type', 'application/json')
      .expect(422)
      .expect('custom parse error', done);
    });
  });
});

function App(options) {
  const app = new Koa();
  // app.outputErrors = true;
  app.use(bodyParser(options));
  return app;
}
