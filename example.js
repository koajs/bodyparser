var Koa = require('koa');
var bodyParser = require('./');

var app = new Koa();
app.use(bodyParser());

app.use((ctx) => {
  // the parsed body will store in this.request.body
  ctx.body = ctx.request.body;
});

app.listen(3000);
