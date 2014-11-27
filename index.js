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
 *   - {Object} extendTypes
 */

module.exports = function (opts) {
  opts = opts || {};
  var jsonOpts = jsonOptions(opts);
  var formOpts = formOptions(opts);
  var extendTypes = opts.extendTypes || {};

  // default json types
  var jsonTypes = [
    'application/json',
    'application/json-patch+json',
    'application/vnd.api+json',
    'application/csp-report',
  ];

  // default form types
  var formTypes = [
    'application/x-www-form-urlencoded',
  ];

  extendType(jsonTypes, extendTypes.json);
  extendType(formTypes, extendTypes.form);

  return function *bodyParser(next) {
    if (this.request.body !== undefined) {
      return yield* next;
    }

    if (this.request.is(jsonTypes)) {
      this.request.body = yield parse.json(this, jsonOpts);
    } else if (this.request.is(formTypes)) {
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

function extendType(original, extend) {
  if (extend) {
    if (!Array.isArray(extend)) extend = [extend];
    extend.forEach(original.push.bind(original));
  }
}