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

  const enableTypes = opts.enableTypes || ['json', 'form'];
  const enableForm = checkEnable(enableTypes, 'form');
  const enableJson = checkEnable(enableTypes, 'json');
  const enableText = checkEnable(enableTypes, 'text');

  opts.detectJSON = undefined;
  opts.onerror = undefined;

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

  // default text types
  const textTypes = [
    'text/plain',
  ];


  const jsonOpts = formatOptions(opts, 'json');
  const formOpts = formatOptions(opts, 'form');
  const textOpts = formatOptions(opts, 'text');

  const extendTypes = opts.extendTypes || {};

  extendType(jsonTypes, extendTypes.json);
  extendType(formTypes, extendTypes.form);
  extendType(textTypes, extendTypes.text);

  return function bodyParser(ctx, next) {
    if (ctx.request.body !== undefined) return next();

    return parseBody(ctx).then(body => {
      ctx.request.body = body;
      return next();
    }, err => onerror(err, ctx));
  };

  function parseBody(ctx) {
    if (enableJson && ((detectJSON && detectJSON(ctx)) || ctx.request.is(jsonTypes))) {
      return parse.json(ctx, jsonOpts);
    }
    if (enableForm && ctx.request.is(formTypes)) {
      return parse.form(ctx, formOpts);
    }
    if (enableText && ctx.request.is(textTypes)) {
      return parse.text(ctx, textOpts) || '';
    }
    return Promise.resolve({});
  }
};

function formatOptions(opts, type) {
  var res = {};
  Object.assign(res, opts);
  res.limit = opts[type + 'Limit'];
  return res;
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

function checkEnable(types, type) {
  return types.indexOf(type) >= 0;
}
