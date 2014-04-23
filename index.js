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
var copy = require('copy-to');

/**
 * @param [Object] opts
 *   - {String} jsonLimit default '1mb'
 *   - {String} formLimit default '56kb'
 *   - {string} encoding default 'utf-8'
 */

module.exports = function (opts) {
  opts = opts || {};
  var jsonOpts = jsonOptions(opts);
  var formOpts = formOptions(opts);

  return function *bodyParser(next) {
    if (this.request.body !== undefined) {
      return yield* next;
    }

    if (this.is('json')) {
      this.request.body = yield parse.json(this, jsonOpts);
    } else if (this.is('urlencoded')) {
      this.request.body = yield parse.form(this, formOpts);
    } else {
      this.request.body = null;
    }

    yield* next;
  };
};

function jsonOptions(opts) {
  var jsonOpts = {};
  copy(opts).to(jsonOpts);
  jsonOpts.limit = opts.jsonLimit;
  return jsonOpts;
}

function formOptions(opts) {
  var formOpts = {};
  copy(opts).to(formOpts);
  formOpts.limit = opts.formLimit;
  return formOpts;
}
