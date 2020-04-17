const Koa = require('koa');
const bodyParser = require('.');

const app = new Koa();
app.use(bodyParser());

app.use(async function() {
  // the parsed body will store in this.request.body
  this.body = this.request.body;
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () =>
  console.log(`Server ready at http://localhost:${PORT} 🚀 ..`)
);
