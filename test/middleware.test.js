/**!
 * koa-body-parser - test/middleware.test.js
 *
 * Copyright(c) 2014
 * MIT Licensed
 *
 * Authors:
 *   dead_horse <dead_horse@qq.com> (http://deadhorse.me)
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

"use strict";

/**
 * Module dependencies.
 */

var fs = require('fs');
var path = require('path');
var request = require('supertest');
var koa = require('koa');
var should = require('should');
var bodyParser = require('../');

var fixtures = path.join(__dirname, 'fixtures');

describe('test/middleware.test.js', function () {
  describe('json body', function () {
    var app = App();

    it('should parse json body ok', function (done) {
      // should work when use body parser again
      app.use(bodyParser());

      app.use(function *() {
        this.request.body.should.eql( {foo: 'bar'} );
        this.body = this.request.body;
      });
      request(app.listen())
      .post('/')
      .send({ foo: 'bar' })
      .expect({ foo: 'bar' }, done);
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
  });

  describe('form body', function () {
    var app = App();

    it('should parse form body ok', function (done) {
      app.use(function *() {
        this.request.body.should.eql( { foo: {bar: 'baz'} } );
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

  describe('other type', function () {
    var app = App();

    it('should get body null', function (done) {
      app.use(function *() {
        should.not.exist(this.request.body);
        done();
      });
      request(app.listen())
      .get('/')
      .end(function () {});
    });
  });
})

function App(options) {
  var app = koa();
  // app.outputErrors = true;
  app.keys = ['a', 'b'];
  app.use(bodyParser(options));
  return app;
}
