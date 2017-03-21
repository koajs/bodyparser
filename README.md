koa-bodyparser
===============

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Coveralls][coveralls-image]][coveralls-url]
[![David deps][david-image]][david-url]
[![node version][node-image]][node-url]
[![Gittip][gittip-image]][gittip-url]

[npm-image]: https://img.shields.io/npm/v/koa-bodyparser.svg?style=flat-square
[npm-url]: https://npmjs.org/package/koa-bodyparser
[travis-image]: https://img.shields.io/travis/koajs/bodyparser.svg?style=flat-square
[travis-url]: https://travis-ci.org/koajs/bodyparser
[coveralls-image]: https://img.shields.io/coveralls/koajs/bodyparser.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/koajs/bodyparser?branch=master
[david-image]: https://img.shields.io/david/koajs/bodyparser.svg?style=flat-square
[david-url]: https://david-dm.org/koajs/bodyparser
[node-image]: https://img.shields.io/badge/node.js-%3E=_0.11-green.svg?style=flat-square
[node-url]: http://nodejs.org/download/
[gittip-image]: https://img.shields.io/gittip/dead-horse.svg?style=flat-square
[gittip-url]: https://www.gittip.com/dead-horse/


A body parser for koa, base on [co-body](https://github.com/tj/co-body). support `json`, `form` and `text` type body.

## Install

[![NPM](https://nodei.co/npm/koa-bodyparser.png?downloads=true)](https://nodei.co/npm/koa-bodyparser/)

## Usage

```js
var koa = require('koa');
var bodyParser = require('koa-bodyparser');

var app = koa();
app.use(bodyParser());

app.use(function *() {
  // the parsed body will store in this.request.body
  // if nothing was parsed, body will be an empty object {}
  this.body = this.request.body;
});
```

## Options

* **enableTypes**: parser will only parse when request type hits enableTypes, default is `['json', 'form']`.
* **encode**: requested encoding. Default is `utf-8` by `co-body`.
* **formLimit**: limit of the `urlencoded` body. If the body ends up being larger than this limit, a 413 error code is returned. Default is `56kb`.
* **jsonLimit**: limit of the `json` body. Default is `1mb`.
* **textLimit**: limit of the `text` body. Default is `1mb`.
* **strict**: when set to true, JSON parser will only accept arrays and objects. Default is `true`. See [strict mode](https://github.com/cojs/co-body#options) in `co-body`. In strict mode, `this.request.body` will always be an object(or array), this avoid lots of type judging. But text body will always return string type.
* **detectJSON**: custom json request detect function. Default is `null`.

  ```js
  app.use(bodyparser({
    detectJSON: function (ctx) {
      return /\.json$/i.test(ctx.path);
    }
  }));
  ```

* **extendTypes**: support extend types:

  ```js
  app.use(bodyparser({
    extendTypes: {
      json: ['application/x-javascript'] // will parse application/x-javascript type body as a JSON string
    }
  }));
  ```

* **onerror**: support custom error handle, if `koa-bodyparser` throw an error, you can customize the response like:

  ```js
  app.use(bodyparser({
    onerror: function (err, ctx) {
      ctx.throw('body parse error', 422);
    }
  }));
  ```

* **disableBodyParser**: you can dynamic disable body parser by set `this.disableBodyParser = true`.

```js
app.use(function* disableBodyParser(next) {
  if (this.path === '/disable') this.disableBodyParser = true;
  return yield next;
});
app.use(bodyparser());
```
## Raw Body

You can access raw request body by `this.request.rawBody` after `koa-bodyparser` when:

1. `koa-bodyparser` parsed the request body.
2. `this.request.rawBody` is not present before `koa-bodyparser`.

## Licences

[MIT](LICENSE)
