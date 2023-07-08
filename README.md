# [**@koa/bodyparser**](https://github.com/koajs/bodyparser)

[![NPM version][npm-image]][npm-url]
![build status][github-action-image]
[![Coveralls][coveralls-image]][coveralls-url]
[![node version][node-image]][node-url]

[npm-image]: https://img.shields.io/npm/v/@koa/bodyparser.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/@koa/bodyparser
[github-action-image]: https://github.com/koajs/bodyparser/actions/workflows/ci.yml/badge.svg?style=flat-square
[coveralls-image]: https://img.shields.io/coveralls/koajs/bodyparser.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/koajs/bodyparser?branch=master
[node-image]: https://img.shields.io/badge/node.js-%3E=_14-green.svg?style=flat-square
[node-url]: http://nodejs.org/download/

Koa body parsing middleware, based on [co-body](https://github.com/tj/co-body). support `json`, `form` and `text` type body.

Parse incoming request bodies in a middleware before your handlers, available under the `ctx.request.body` property.

> ⚠ Notice: **This module doesn't support parsing multipart format data**, please use [`@koa/multer`](https://github.com/koajs/multer) to parse multipart format data.

## Install

[![NPM](https://nodei.co/npm/@koa/bodyparser.png?downloads=true)](https://nodei.co/npm/@koa/bodyparser)

```bash
$ npm i @koa/bodyparser --save
```

## Usage

```js
const Koa = require("koa");
const { bodyParser } = require("@koa/bodyparser");

const app = new Koa();
app.use(bodyParser());

app.use((ctx) => {
  // the parsed body will store in ctx.request.body
  // if nothing was parsed, body will be an empty object {}
  ctx.body = ctx.request.body;
});
```

## Options

- **patchNode**: patch request body to Node's `ctx.req`, default is `false`.
- **enableTypes**: parser will only parse when request type hits enableTypes, support `json/form/text/xml`, default is `['json', 'form']`.
- **encoding**: requested encoding. Default is `utf-8` by `co-body`.
- **formLimit**: limit of the `urlencoded` body. If the body ends up being larger than this limit, a 413 error code is returned. Default is `56kb`.
- **jsonLimit**: limit of the `json` body. Default is `1mb`.
- **textLimit**: limit of the `text` body. Default is `1mb`.
- **xmlLimit**: limit of the `xml` body. Default is `1mb`.
- **jsonStrict**: when set to true, JSON parser will only accept arrays and objects. Default is `true`. See [strict mode](https://github.com/cojs/co-body#options) in `co-body`. In strict mode, `ctx.request.body` will always be an object(or array), this avoid lots of type judging. But text body will always return string type.
- **detectJSON**: custom json request detect function. Default is `null`.

  ```js
  app.use(
    bodyParser({
      detectJSON(ctx) {
        return /\.json$/i.test(ctx.path);
      },
    })
  );
  ```

- **extendTypes**: support extend types:

  ```js
  app.use(
    bodyParser({
      extendTypes: {
        // will parse application/x-javascript type body as a JSON string
        json: ["application/x-javascript"],
      },
    })
  );
  ```

- **onError**: support custom error handle, if `koa-bodyparser` throw an error, you can customize the response like:

  ```js
  app.use(
    bodyParser({
      onError(err, ctx) {
        ctx.throw(422, "body parse error");
      },
    })
  );
  ```

- **enableRawChecking**: support the already parsed body on the raw request by override and prioritize the parsed value over the sended payload. (default is `false`)

- **parsedMethods**: declares the HTTP methods where bodies will be parsed, default `['POST', 'PUT', 'PATCH']`.

- **disableBodyParser**: you can dynamic disable body parser by set `ctx.disableBodyParser = true`.

  ```js
  app.use((ctx, next) => {
    if (ctx.path === "/disable") ctx.disableBodyParser = true;
    return next();
  });
  app.use(bodyParser());
  ```

## Raw Body

You can access raw request body by `ctx.request.rawBody` after `koa-bodyparser` when:

1. `koa-bodyparser` parsed the request body.
2. `ctx.request.rawBody` is not present before `koa-bodyparser`.

## Koa v1.x.x Support

To use `koa-bodyparser` with koa@1.x.x, please use [bodyparser 2.x](https://github.com/koajs/bodyparser/tree/2.x).

```bash
$ npm install koa-bodyparser@2 --save
```

usage

```js
const Koa = require("koa");
const bodyParser = require("@koa/bodyparser");

const app = new Koa();
app.use(bodyParser());

app.use((ctx) => {
  // the parsed body will store in ctx.request.body
  // if nothing was parsed, body will be an empty object {}
  ctx.body = ctx.request.body;
});
```

## Licences

[MIT](LICENSE)
