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

describe('test/middleware.test.js', () => {
  describe('json body', () => {
    const app = App();

    it('should parse json body ok', done => {
      // should work when use body parser again
      app.use(bodyParser());

      app.use(ctx => {
        ctx.request.body.should.eql( {foo: 'bar'} );
        ctx.body = ctx.request.body;
      });
      request(app.listen())
      .post('/')
      .send({ foo: 'bar' })
      .expect({ foo: 'bar' }, done);
    });

    it('should parse json body with json-api headers ok', done => {
      // should work when use body parser again
      app.use(bodyParser());

      app.use(ctx => {
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

    it('should parse json patch', done => {
      const app = App();
      app.use(ctx => {
        ctx.request.body.should.eql( [{op: 'add', path: '/foo', value: 'bar'}] );
        ctx.body = ctx.request.body;
      });
      request(app.listen())
        .patch('/')
        .set('Content-type', 'application/json-patch+json')
        .send('[{"op": "add", "path": "/foo", "value": "bar"}]')
        .expect([{op: 'add', path: '/foo', value: 'bar'}], done);
    });

    it('should json body reach the limit size', done => {
      const app = App({jsonLimit: 100});
      app.use(ctx => {
        ctx.body = ctx.request.body;
      });
      request(app.listen())
      .post('/')
      .send(require(path.join(fixtures, 'raw.json')))
      .expect(413, done);
    });

    it('should json body error with string in strict mode', done => {
      const app = App({jsonLimit: 100});
      app.use(ctx => {
        ctx.body = ctx.request.body;
      });
      request(app.listen())
      .post('/')
      .set('Content-type', 'application/json')
      .send('"invalid"')
      .expect(400, done);
    });

    it('should json body ok with string not in strict mode', done => {
      const app = App({jsonLimit: 100, strict: false});
      app.use(ctx => {
        ctx.body = ctx.request.body;
      });
      request(app.listen())
      .post('/')
      .set('Content-type', 'application/json')
      .send('"valid"')
      .expect(200)
      .expect('valid', done);
    });

    describe('opts.detectJSON', () => {
      it('should parse json body on /foo.json request', done => {
        const app = App({
          detectJSON: ctx => {
            return /\.json/i.test(ctx.path);
          }
        });

        app.use(ctx => {
          ctx.request.body.should.eql( {foo: 'bar'} );
          ctx.body = ctx.request.body;
        });

        request(app.listen())
        .post('/foo.json')
        .send(JSON.stringify({ foo: 'bar' }))
        .expect({ foo: 'bar' }, done);
      });

      it('should not parse json body on /foo request', done => {
        const app = App({
          detectJSON: ctx => {
            return /\.json/i.test(ctx.path);
          }
        });

        app.use(ctx => {
          ctx.body = ctx.request.body;
        });

        request(app.listen())
        .post('/foo')
        .send(JSON.stringify({ foo: 'bar' }))
        .expect({ '{"foo":"bar"}': '' }, done);
      });
    });
  });

  describe('form body', () => {
    const app = App();

    it('should parse form body ok', done => {
      app.use(ctx => {
        ctx.request.body.should.eql( { foo: {bar: 'baz'} } );
        ctx.body = ctx.request.body;
      });
      request(app.listen())
      .post('/')
      .type('form')
      .send({ foo: {bar: 'baz'} })
      .expect({ foo: {bar: 'baz'} }, done);
    });

    it('should parse form body reach the limit size', done => {
      const app = App({formLimit: 10});
      request(app.listen())
      .post('/')
      .type('form')
      .send({foo: {bar: 'bazzzzzzz'}})
      .expect(413, done);
    });
  });

  describe('text body', () => {
    it('should parse text body ok', done => {
      var app = App({
        enableTypes: ['text', 'json'],
      });
      app.use(ctx => {
        ctx.request.body.should.equal('body');
        ctx.body = ctx.request.body;
      });
      request(app.listen())
      .post('/')
      .type('text')
      .send('body')
      .expect('body', done);
    });

    it('should not parse text body when disable', done => {
      var app = App();
      app.use(ctx => {
        ctx.body = ctx.request.body;
      });
      request(app.listen())
      .post('/')
      .type('text')
      .send('body')
      .expect({}, done);
    });
  });

  describe('extent type', () => {
    it('should extent json ok', done => {
      const app = App({
        extendTypes: {
          json: 'application/x-javascript'
        }
      });
      app.use(ctx => {
        ctx.body = ctx.request.body;
      });

      request(app.listen())
        .post('/')
        .type('application/x-javascript')
        .send(JSON.stringify({ foo: 'bar' }))
        .expect({ foo: 'bar' }, done);
    });

    it('should extent json with array ok', done => {
      const app = App({
        extendTypes: {
          json: ['application/x-javascript', 'application/y-javascript']
        }
      });
      app.use(ctx => {
        ctx.body = ctx.request.body;
      });

      request(app.listen())
        .post('/')
        .type('application/x-javascript')
        .send(JSON.stringify({ foo: 'bar' }))
        .expect({ foo: 'bar' }, done);
    });
  });

  describe('other type', () => {
    const app = App();

    it('should get body null', done => {
      app.use(ctx => {
        ctx.request.body.should.eql( {} );
        ctx.body = ctx.request.body;
      });
      request(app.listen())
      .get('/')
      .end(done);
    });
  });

  describe('enableTypes', ctx => {
    it('should disable json success', done => {
      var app = App({
        enableTypes: ['form'],
      });

      app.use(ctx => {
        ctx.body = ctx.request.body;
      });
      request(app.listen())
      .post('/')
      .type('json')
      .send({ foo: 'bar' })
      .expect({}, done);
    });
  });

  describe('onerror', () => {
    const app = App({
      onerror: function (err, ctx) {
        ctx.throw('custom parse error', 422);
      }
    });

    it('should get custom error message', done => {
      app.use(ctx => {
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
