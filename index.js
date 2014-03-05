/**!
 * koa-body-parser - index.js
 * Copyright(c) 2014
 * MIT Licensed
 *
 * Authors:
 *   dead_horse <dead_horse@qq.com> (http://deadhorse.me)
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var parse = require('co-body');

function jsonOptions(opts) {
  if (!opts || !opts.jsonLimit) {
    return opts;
  }
  var jsonOpts = {};
  for (var k in opts) {
    jsonOpts[k] = opts[k];
  }
  jsonOpts.limit = jsonOpts.jsonLimit;
  return jsonOpts;
}

function *parseBody(ctx, formOpts, jsonOpts) {
  var request = ctx.request;
  if (request.body !== undefined) {
    return request.body;
  }

  if (ctx.is('application/json')) {
    request.body = yield parse.json(ctx, jsonOpts);
  } else if (ctx.is('application/x-www-form-urlencoded')) {
    request.body = yield parse.form(ctx, formOpts);
  } else {
    request.body = null;
  }

  return request.body;
}

/**
 * @param {Object} app koa app instance
 * @param [Object] opts
 *   - {String} limit default json encode limit is '1mb' and default urlencoded limit is '56kb'
 *   - {string} encoding default 'utf-8'
 */
module.exports = function (app, opts) {
  if (!app || !app.context) {
    return middleware(app);
  }
  var jsonOpts = jsonOptions(opts);
  app.context.__defineGetter__('bodyParser', function *() {
    return yield *parseBody(this, opts, jsonOpts);
  });

  app.request.__defineGetter__('bodyParser', function () {
    return this.ctx.bodyParser;
  });
};

function middleware(opts) {
  var jsonOpts = jsonOptions(opts);
  return function *bodyParser(next) {
    if (this.request.body !== undefined) {
      return yield *next;
    }

    yield *parseBody(this, opts, jsonOpts)
    yield *next;
  };
}
