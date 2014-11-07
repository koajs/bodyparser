var koa = require('koa');
var bodyParser = require('./');

var app = koa();
app.use(bodyParser());

app.use(function *() {
  // the parsed body will store in this.request.body
  this.body = this.request.body;
});

app.listen(3000);
