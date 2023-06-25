import Koa from 'koa';
import {bodyParser} from '../../src';

const app = new Koa();
app.use(bodyParser());

app.use((ctx) => {
  // the parsed body will store in this.request.body
  ctx.body = ctx.request.body; // eslint-disable-line @typescript-eslint/no-unsafe-assignment
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server ready at http://localhost:${PORT} 🚀 ..`);
});
