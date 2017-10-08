var koa = require('koa');
var bodyParser = require('./');

var app = new koa();
app.use(bodyParser({ enableTypes: ['json', 'form', 'multipart'] }));

app.use(function *() {
  // the parsed body will store in this.request.body
  this.body = this.request.body
});

app.listen(3000);
