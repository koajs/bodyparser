/** !
 * koa-body-parser - test/middleware.test.js
 *
 * Copyright(c) 2014
 * MIT Licensed
 *
 * Authors:
 *   dead_horse <dead_horse@qq.com> (http://deadhorse.me)
 *   fengmk2 <m@fengmk2.com> (http://fengmk2.com)
 */

'use strict';

/**
 * Module dependencies.
 */

const path = require('path');
const request = require('supertest');
const Koa = require('koa');
const bodyParser = require('..');

const fixtures = path.join(__dirname, 'fixtures');

describe('test/middleware.test.js', function() {
  describe('json body', function() {
    let app;
    beforeEach(function() {
      app = App();
    });

    it('should parse json body ok', function(done) {
      // should work when use body parser again
      app.use(bodyParser());

      app.use(async ctx => {
        ctx.request.body.should.eql({foo: 'bar'});
        ctx.request.rawBody.should.equal('{"foo":"bar"}');
        ctx.body = ctx.request.body;
      });
      request(app.listen())
        .post('/')
        .send({foo: 'bar'})
        .expect({foo: 'bar'}, done);
    });

    it('should parse json body with json-api headers ok', function(done) {
      // should work when use body parser again
      app.use(bodyParser());

      app.use(async ctx => {
        ctx.request.body.should.eql({foo: 'bar'});
        ctx.request.rawBody.should.equal('{"foo": "bar"}');
        ctx.body = ctx.request.body;
      });
      request(app.listen())
        .post('/')
        .set('Accept', 'application/vnd.api+json')
        .set('Content-type', 'application/vnd.api+json')
        .send('{"foo": "bar"}')
        .expect({foo: 'bar'}, done);
    });

    it('should parse json patch', function(done) {
      const app = App();
      app.use(async ctx => {
        ctx.request.body.should.eql([{op: 'add', path: '/foo', value: 'bar'}]);
        ctx.request.rawBody.should.equal(
          '[{"op": "add", "path": "/foo", "value": "bar"}]'
        );
        ctx.body = ctx.request.body;
      });
      request(app.listen())
        .patch('/')
        .set('Content-type', 'application/json-patch+json')
        .send('[{"op": "add", "path": "/foo", "value": "bar"}]')
        .expect([{op: 'add', path: '/foo', value: 'bar'}], done);
    });

    it('should json body reach the limit size', function(done) {
      const app = App({jsonLimit: 100});
      app.use(async ctx => {
        ctx.body = ctx.request.body;
      });
      request(app.listen())
        .post('/')
        .send(require(path.join(fixtures, 'raw.json')))
        .expect(413, done);
    });

    it('should json body error with string in strict mode', function(done) {
      const app = App({jsonLimit: 100});
      app.use(async ctx => {
        ctx.request.rawBody.should.equal('"invalid"');
        ctx.body = ctx.request.body;
      });
      request(app.listen())
        .post('/')
        .set('Content-type', 'application/json')
        .send('"invalid"')
        .expect(400, done);
    });

    it('should json body ok with string not in strict mode', function(done) {
      const app = App({jsonLimit: 100, strict: false});
      app.use(async ctx => {
        ctx.request.rawBody.should.equal('"valid"');
        ctx.body = ctx.request.body;
      });
      request(app.listen())
        .post('/')
        .set('Content-type', 'application/json')
        .send('"valid"')
        .expect(200)
        .expect('valid', done);
    });

    describe('opts.detectJSON', function() {
      it('should parse json body on /foo.json request', function(done) {
        const app = App({
          detectJSON(ctx) {
            return /\.json/i.test(ctx.path);
          }
        });

        app.use(async ctx => {
          ctx.request.body.should.eql({foo: 'bar'});
          ctx.request.rawBody.should.equal('{"foo":"bar"}');
          ctx.body = ctx.request.body;
        });

        request(app.listen())
          .post('/foo.json')
          .send(JSON.stringify({foo: 'bar'}))
          .expect({foo: 'bar'}, done);
      });

      it('should not parse json body on /foo request', function(done) {
        const app = App({
          detectJSON(ctx) {
            return /\.json/i.test(ctx.path);
          }
        });

        app.use(async ctx => {
          ctx.request.rawBody.should.equal('{"foo":"bar"}');
          ctx.body = ctx.request.body;
        });

        request(app.listen())
          .post('/foo')
          .send(JSON.stringify({foo: 'bar'}))
          .expect({'{"foo":"bar"}': ''}, done);
      });
    });
  });

  describe('form body', function() {
    const app = App();

    it('should parse form body ok', function(done) {
      app.use(async ctx => {
        ctx.request.body.should.eql({foo: {bar: 'baz'}});
        ctx.request.rawBody.should.equal('foo%5Bbar%5D=baz');
        ctx.body = ctx.request.body;
      });
      request(app.listen())
        .post('/')
        .type('form')
        .send({foo: {bar: 'baz'}})
        .expect({foo: {bar: 'baz'}}, done);
    });

    it('should parse form body reach the limit size', function(done) {
      const app = App({formLimit: 10});
      request(app.listen())
        .post('/')
        .type('form')
        .send({foo: {bar: 'bazzzzzzz'}})
        .expect(413, done);
    });
  });

  describe('text body', function() {
    it('should parse text body ok', function(done) {
      const app = App({
        enableTypes: ['text', 'json']
      });
      app.use(async ctx => {
        ctx.request.body.should.equal('body');
        ctx.request.rawBody.should.equal('body');
        ctx.body = ctx.request.body;
      });
      request(app.listen())
        .post('/')
        .type('text')
        .send('body')
        .expect('body', done);
    });

    it('should not parse text body when disable', function(done) {
      const app = App();
      app.use(async ctx => {
        ctx.body = ctx.request.body;
      });
      request(app.listen())
        .post('/')
        .type('text')
        .send('body')
        .expect({}, done);
    });
  });

  describe('xml body', function() {
    it('should parse xml body ok', function(done) {
      const app = App({
        enableTypes: ['xml']
      });
      app.use(async ctx => {
        ctx.headers['content-type'].should.equal('application/xml');
        ctx.request.body.should.equal('<xml>abc</xml>');
        ctx.request.rawBody.should.equal('<xml>abc</xml>');
        ctx.body = ctx.request.body;
      });
      request(app.listen())
        .post('/')
        .type('xml')
        .send('<xml>abc</xml>')
        .expect('<xml>abc</xml>', done);
    });

    it('should not parse text body when disable', function(done) {
      const app = App();
      app.use(async ctx => {
        ctx.headers['content-type'].should.equal('application/xml');
        ctx.body = ctx.request.body;
      });
      request(app.listen())
        .post('/')
        .type('xml')
        .send('<xml>abc</xml>')
        .expect({}, done);
    });

    it('should xml body reach the limit size', function(done) {
      const app = App({
        enableTypes: ['xml'],
        xmlLimit: 10
      });
      app.use(async ctx => {
        ctx.headers['content-type'].should.equal('application/xml');
        ctx.body = ctx.request.body;
      });
      request(app.listen())
        .post('/')
        .type('xml')
        .send('<xml>abcdefghijklmn</xml>')
        .expect(413, done);
    });
  });

  describe('html body', function () {
    it('should parse html body ok', function (done) {
      const app = App({
        enableTypes: ['html'],
      });
      app.use(async (ctx) => {
        ctx.headers['content-type'].should.equal('text/html');
        ctx.request.body.should.equal('<h1>abc</h1>');
        ctx.request.rawBody.should.equal('<h1>abc</h1>');
        ctx.body = ctx.request.body;
      });
      request(app.listen())
      .post('/')
      .type('html')
      .send('<h1>abc</h1>')
      .expect('<h1>abc</h1>', done);
    });

    it('should not parse html body when disable', function (done) {
      const app = App();
      app.use(async (ctx) => {
        ctx.headers['content-type'].should.equal('text/html');
        ctx.body = ctx.request.body;
      });
      request(app.listen())
      .post('/')
      .type('html')
      .send('<h1>abc</h1>')
      .expect({}, done);
    });
  });

  describe('extend type', function() {
    it('should extend json ok', function(done) {
      const app = App({
        extendTypes: {
          json: 'application/x-javascript'
        }
      });
      app.use(async ctx => {
        ctx.body = ctx.request.body;
      });

      request(app.listen())
        .post('/')
        .type('application/x-javascript')
        .send(JSON.stringify({foo: 'bar'}))
        .expect({foo: 'bar'}, done);
    });

    it('should extend json with array ok', function(done) {
      const app = App({
        extendTypes: {
          json: ['application/x-javascript', 'application/y-javascript']
        }
      });
      app.use(async ctx => {
        ctx.body = ctx.request.body;
      });

      request(app.listen())
        .post('/')
        .type('application/x-javascript')
        .send(JSON.stringify({foo: 'bar'}))
        .expect({foo: 'bar'}, done);
    });

    it('should extend xml ok', function(done) {
      const app = App({
        enableTypes: ['xml'],
        extendTypes: {
          xml: 'application/xml-custom'
        }
      });
      app.use(async ctx => {
        ctx.body = ctx.request.body;
      });

      request(app.listen())
        .post('/')
        .type('application/xml-custom')
        .send('<xml>abc</xml>')
        .expect('<xml>abc</xml>', done);
    });
  });

  describe('enableTypes', function() {
    it('should disable json success', function(done) {
      const app = App({
        enableTypes: ['form']
      });

      app.use(async ctx => {
        ctx.body = ctx.request.body;
      });
      request(app.listen())
        .post('/')
        .type('json')
        .send({foo: 'bar'})
        .expect({}, done);
    });
  });

  describe('other type', function() {
    const app = App();

    it('should get body null', function(done) {
      app.use(async ctx => {
        ctx.request.body.should.eql({});
        ctx.body = ctx.request.body;
      });
      request(app.listen())
        .get('/')
        .expect({}, done);
    });
  });

  describe('onerror', function() {
    const app = App({
      onerror(err, ctx) {
        ctx.throw('custom parse error', 422);
      }
    });

    it('should get custom error message', function(done) {
      app.use(async ctx => {});
      request(app.listen())
        .post('/')
        .send('test')
        .set('content-type', 'application/json')
        .expect(422)
        .expect('custom parse error', done);
    });
  });

  describe('disableBodyParser', () => {
    it('should not parse body when disableBodyParser set to true', function(done) {
      const app = new Koa();
      app.use(async (ctx, next) => {
        ctx.disableBodyParser = true;
        await next();
      });
      app.use(bodyParser());
      app.use(async ctx => {
        (undefined === ctx.request.rawBody).should.equal(true);
        ctx.body = ctx.request.body ? 'parsed' : 'empty';
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
  const app = new Koa();
  app.use(bodyParser(options));
  return app;
}
