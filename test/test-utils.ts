import path from "path";
import Koa from "koa";

import bodyParser from "../src";
import type { BodyParserOptions } from "../src/body-parser.types";

export const fixtures = path.join(__dirname, "fixtures");
type CreateAppConfig = BodyParserOptions & {
  rawParsedBody?: Record<string, string>;
};

export const createApp = (config: CreateAppConfig = {}) => {
  const { rawParsedBody, ...options } = config;
  const app = new Koa();
  rawParsedBody &&
    app.use((ctx, next) => {
      ctx.req.body = rawParsedBody;
      return next();
    });

  app.use(bodyParser(options));
  return app;
};
