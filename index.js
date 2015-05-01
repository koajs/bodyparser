/**!
 * koa-body-parser - index.js
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
  var detectJSON = opts.detectJSON;
  var onerror = opts.onerror;
  opts.detectJSON = undefined;
  opts.onerror = undefined;

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
    if (this.request.body !== undefined) return yield* next;

    try {
      yield* parseBody(this);
    } catch (err) {
      if (onerror) {
        onerror(err, this);
      } else {
        throw err;
      }
    }

    yield* next;
  };

  function* parseBody(ctx) {
    if ((detectJSON && detectJSON(ctx)) || ctx.request.is(jsonTypes)) {
      ctx.request.body = yield parse.json(ctx, jsonOpts);
    } else if (ctx.request.is(formTypes)) {
      ctx.request.body = yield parse.form(ctx, formOpts);
    } else {
      ctx.request.body = {};
    }
  }
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
    if (!Array.isArray(extend)) {
      extend = [extend];
    }
    extend.forEach(function (extend) {
      original.push(extend);
    });
  }
}
