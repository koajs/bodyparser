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

const parse = require('co-body');

/**
 * @param [Object] opts
 *   - {String} jsonLimit default '1mb'
 *   - {String} formLimit default '56kb'
 *   - {string} encoding default 'utf-8'
 *   - {Object} extendTypes
 */

module.exports = function (opts) {
  opts = opts || {};
  const detectJSON = opts.detectJSON;
  const onerror = opts.onerror || throwError;

  opts.detectJSON = undefined;
  opts.onerror = undefined;

  const jsonOpts = jsonOptions(opts);
  const formOpts = formOptions(opts);
  const extendTypes = opts.extendTypes || {};

  // default json types
  const jsonTypes = [
    'application/json',
    'application/json-patch+json',
    'application/vnd.api+json',
    'application/csp-report',
  ];

  // default form types
  const formTypes = [
    'application/x-www-form-urlencoded',
  ];

  extendType(jsonTypes, extendTypes.json);
  extendType(formTypes, extendTypes.form);

  return function bodyParser(ctx, next) {
    if (ctx.request.body !== undefined) return next();

    return parseBody(ctx).then(body => {
      ctx.request.body = body;
      return next();
    }, err => onerror(err, ctx));
  };

  function parseBody(ctx) {
    if ((detectJSON && detectJSON(ctx)) || ctx.request.is(jsonTypes)) {
      return parse.json(ctx, jsonOpts);
    } else if (ctx.request.is(formTypes)) {
      return parse.form(ctx, formOpts);
    } else {
      return Promise.resolve({});
    }
  }
};

function jsonOptions(opts) {
  const jsonOpts = {};
  Object.assign(jsonOpts, opts);
  jsonOpts.limit = opts.jsonLimit;
  return jsonOpts;
}

function formOptions(opts) {
  const formOpts = {};
  Object.assign(formOpts, opts);
  formOpts.limit = opts.formLimit;
  return formOpts;
}

function extendType(original, extend) {
  if (extend) {
    if (!Array.isArray(extend)) {
      extend = [extend];
    }
    extend.forEach(extend => original.push(extend));
  }
}

function throwError(err) {
  throw err;
}
