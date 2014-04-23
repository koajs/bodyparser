koa-body-parser [![Build Status](https://secure.travis-ci.org/koajs/body-parser.png)](http://travis-ci.org/koajs/body-parser)
===============

a body parser for koa, base on [co-body](https://github.com/visionmedia/co-body).

## Install

[![NPM](https://nodei.co/npm/koa-bodyparser.png?downloads=true)](https://nodei.co/npm/koa-bodyparser/)

## Usage

```js
var koa = require('koa');
var bodyParser = require('koa-bodyparser');

var app = koa();
koa.use(bodyParser());

app.use(function *() {
  // the parsed body will store in this.request.body
  this.body = this.request.body;
});
```

## Options

* **encode**: requested encoding. Default is `utf-8` by `co-body`
* **formLimit**: limit of the `urlencoded` body. If the body ends up being larger than this limit, a 413 error code is returned. Default is `56kb`
* **jsonLimit**: limit of the `json` body. Default is `56kb`

## Licences
(The MIT License)

Copyright (c) 2014 dead-horse and other contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
