/**!
 * koa-body-parser - index.js
 * Copyright(c) 2014
 * MIT Licensed
 *
 * Authors:
 *   dead_horse <dead_horse@qq.com> (http://deadhorse.me)
 */

'use strict';

/**
 * Module dependencies.
 */

var co = require('co');
var parse = require('co-body');

/**
 * @param {Object} app koa app instance
 * @param [Object] opts
 *   - {String} limit default json encode limit is '1mb' and default urlencoded limit is '56kb'
 *   - {string} encoding default 'utf-8'
 */
module.exports = function (app, opts) {
  app.context.__defineGetter__('bodyParser', function () {
    var ctx = this;
    var request = this.request;
    if (request.body !== undefined) {
      return request.body;
    }

    return co(function *(customOpts) {
      if (ctx.is('application/json')) {
        return request.body = yield parse.json(ctx, opts);
      } else if (ctx.is('application/x-www-form-urlencoded')) {
        return request.body = yield parse.form(ctx, opts);
      } else {
        return request.body = null;
      }
    });
  });

  app.request.__defineGetter__('bodyParser', function () {
    return this.ctx.bodyParser;
  });
};

module.exports.middleware = function (opts) {
  return function *bodyParser(next) {
    if (this.request.body !== undefined) {
      return yield next;
    }

    if (this.is('application/json')) {
      this.request.body = yield parse.json(this, opts);
    } else if (this.is('application/x-www-form-urlencoded')) {
      this.request.body = yield parse.form(this, opts);
    } else {
      this.request.body = null;
    }
    yield next;
  };
};
