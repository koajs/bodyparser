import Koa from 'koa';
import bodyParser from '../../dist/index.mjs';

const app = new Koa();
app.use(bodyParser());

app.use((ctx) => {
  // the parsed body will store in this.request.body
  ctx.body = ctx.request.body;
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server ready at http://localhost:${PORT} 🚀 ..`));
