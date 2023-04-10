import parser from 'co-body';
import type * as Koa from 'koa';
import type {BodyParserOptions, BodyType} from './body-parser.types';
import {getIsEnabledBodyAs, getMimeTypes} from './body-parser.utils';

/**
 * Global declaration for the added properties to the 'ctx.request'
 */
declare module 'koa' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Request {
    body?: any;
    rawBody: string;
  }
}

/**
 * Middleware wrapper which delegate options to the core code
 */
export function bodyParserWrapper(opts: BodyParserOptions = {}) {
  const {
    detectJSON,
    onerror,
    enableTypes = ['json', 'form'],
    extendTypes = {} as NonNullable<BodyParserOptions['extendTypes']>,
    ...restOpts
  } = opts;
  const isEnabledBodyAs = getIsEnabledBodyAs(enableTypes);
  const mimeTypes = getMimeTypes(extendTypes);

  /**
   * Handler to parse the request coming data
   */
  async function parseBody(ctx: Koa.Context) {
    const shouldParseBodyAs = (type: BodyType) =>
      Boolean(isEnabledBodyAs[type] && ctx.request.is(mimeTypes[type]));
    const bodyType =
      detectJSON?.(ctx) || shouldParseBodyAs('json')
        ? 'json'
        : shouldParseBodyAs('form')
        ? 'form'
        : shouldParseBodyAs('text') || shouldParseBodyAs('xml')
        ? 'text'
        : null;

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    if (!bodyType) return {} as Record<string, string>;
    const parserOptions = {
      // force co-body return raw body
      returnRawBody: true,
      strict: restOpts.strict,
      [`${bodyType}Types`]: mimeTypes[bodyType],
      limit: restOpts[`${shouldParseBodyAs('xml') ? 'xml' : bodyType}Limit`],
    };

    return parser[bodyType](ctx, parserOptions) as Promise<
      Record<string, string>
    >;
  }

  return async function (ctx: Koa.Context, next: Koa.Next) {
    if (ctx.request.body !== undefined || ctx.disableBodyParser) return next();
    try {
      const response = await parseBody(ctx);
      ctx.request.body = 'parsed' in response ? response.parsed : {};
      if (ctx.request.rawBody === undefined) ctx.request.rawBody = response.raw;
    } catch (err: unknown) {
      if (!onerror) throw err;
      onerror(err as Error, ctx);
    }

    return next();
  };
}
