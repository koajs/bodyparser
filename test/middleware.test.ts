import path from 'path';
import request from 'supertest';
import Koa from 'koa';

import bodyParser from '../src';
import { UnsupportedBodyTypeError } from '../src/body-parser.utils';

import { createApp, fixtures } from './test-utils';

describe('test/body-parser.test.ts', () => {
  describe('json body', () => {
    it('should parse json body ok', async () => {
      const app = createApp();

      // should work when use body parser again
      app.use(bodyParser());

      app.use(async (ctx) => {
        expect(ctx.request.body).toEqual({ foo: 'bar' });
        expect(ctx.request.rawBody).toEqual('{"foo":"bar"}');
        ctx.body = ctx.request.body;
      });

      await request(app.callback())
        .post('/')
        .send({ foo: 'bar' })
        .expect({ foo: 'bar' });
    });

    it('should parse json body with json-api headers ok', async () => {
      const app = createApp();

      // should work when use body parser again
      app.use(bodyParser());

      app.use(async (ctx) => {
        expect(ctx.request.body).toEqual({ foo: 'bar' });
        expect(ctx.request.rawBody).toEqual('{"foo": "bar"}');
        ctx.body = ctx.request.body;
      });

      await request(app.callback())
        .post('/')
        .set('Accept', 'application/vnd.api+json')
        .set('Content-type', 'application/vnd.api+json')
        .send('{"foo": "bar"}')
        .expect({ foo: 'bar' });
    });

    it('should parse json body with `content-type: application/json;charset=utf-8;` headers ok', async () => {
      const app = createApp();

      app.use(bodyParser());

      app.use(async (ctx) => {
        expect(ctx.request.body).toEqual({ foo: 'bar' });
        expect(ctx.request.rawBody).toEqual('{"foo": "bar"}');
        ctx.body = ctx.request.body;
      });

      await request(app.callback())
        .post('/')
        .set('Content-type', 'application/json;charset=utf-8;')
        .send('{"foo": "bar"}')
        .expect({ foo: 'bar' });
    });

    it('should parse json patch', async () => {
      const app = createApp();
      app.use(async (ctx) => {
        expect(ctx.request.body).toEqual([
          { op: 'add', path: '/foo', value: 'bar' },
        ]);
        expect(ctx.request.rawBody).toEqual(
          '[{"op": "add", "path": "/foo", "value": "bar"}]'
        );
        ctx.body = ctx.request.body;
      });

      await request(app.callback())
        .patch('/')
        .set('Content-type', 'application/json-patch+json')
        .send('[{"op": "add", "path": "/foo", "value": "bar"}]')
        .expect([{ op: 'add', path: '/foo', value: 'bar' }]);
    });

    it('should json body reach the limit size', async () => {
      const app = createApp({ jsonLimit: 100 });
      app.use(async (ctx) => {
        ctx.body = ctx.request.body;
      });

      await request(app.callback())
        .post('/')
        .send(require(path.join(fixtures, 'raw.json')))
        .expect(413);
    });

    it('should json body error with string in strict mode', async () => {
      const app = createApp({ jsonLimit: 100 });
      app.use(async (ctx) => {
        expect(ctx.request.rawBody).toEqual('"invalid"');
        ctx.body = ctx.request.body;
      });

      await request(app.callback())
        .post('/')
        .set('Content-type', 'application/json')
        .send('"invalid"')
        .expect(400);
    });

    it('should json body ok with string not in strict mode', async () => {
      const app = createApp({ jsonLimit: 100, jsonStrict: false });
      app.use(async (ctx) => {
        expect(ctx.request.rawBody).toEqual('"valid"');
        ctx.body = ctx.request.body;
      });

      await request(app.callback())
        .post('/')
        .set('Content-type', 'application/json')
        .send('"valid"')
        .expect(200)
        .expect('valid');
    });

    describe('opts.detectJSON', () => {
      it('should parse json body on /foo.json request', async () => {
        const app = createApp({
          detectJSON(ctx) {
            return /\.json/i.test(ctx.path);
          },
        });

        app.use(async (ctx) => {
          expect(ctx.request.body).toEqual({ foo: 'bar' });
          expect(ctx.request.rawBody).toEqual('{"foo":"bar"}');
          ctx.body = ctx.request.body;
        });

        await request(app.callback())
          .post('/foo.json')
          .send(JSON.stringify({ foo: 'bar' }))
          .expect({ foo: 'bar' });
      });

      it('should not parse json body on /foo request', async () => {
        const app = createApp({
          detectJSON(ctx) {
            return /\.json/i.test(ctx.path);
          },
        });

        app.use(async (ctx) => {
          expect(ctx.request.rawBody).toEqual('{"foo":"bar"}');
          ctx.body = ctx.request.body;
        });

        await request(app.callback())
          .post('/foo')
          .send(JSON.stringify({ foo: 'bar' }))
          .expect({ '{"foo":"bar"}': '' });
      });
    });
  });

  describe('form body', () => {
    const app = createApp();

    it('should parse form body ok', async () => {
      app.use(async (ctx) => {
        expect(ctx.request.body).toEqual({ foo: { bar: 'baz' } });
        expect(ctx.request.rawBody).toEqual('foo%5Bbar%5D=baz');
        ctx.body = ctx.request.body;
      });

      await request(app.callback())
        .post('/')
        .type('form')
        .send({ foo: { bar: 'baz' } })
        .expect({ foo: { bar: 'baz' } });
    });

    it('should parse form body reach the limit size', async () => {
      const app = createApp({ formLimit: 10 });

      await request(app.callback())
        .post('/')
        .type('form')
        .send({ foo: { bar: 'bazzzzzzz' } })
        .expect(413);
    });
  });

  describe('text body', () => {
    it('should parse text body ok', async () => {
      const app = createApp({
        enableTypes: ['text', 'json'],
      });
      app.use(async (ctx) => {
        expect(ctx.request.body).toEqual('body');
        expect(ctx.request.rawBody).toEqual('body');
        ctx.body = ctx.request.body;
      });

      await request(app.callback())
        .post('/')
        .type('text')
        .send('body')
        .expect('body');
    });

    it('should not parse text body when disable', async () => {
      const app = createApp();
      app.use(async (ctx) => {
        ctx.body = ctx.request.body;
      });

      await request(app.callback())
        .post('/')
        .type('text')
        .send('body')
        .expect({});
    });
  });

  describe('xml body', () => {
    it('should parse xml body ok', async () => {
      const app = createApp({
        enableTypes: ['xml'],
      });
      app.use(async (ctx) => {
        expect(ctx.headers['content-type']).toEqual('application/xml');
        expect(ctx.request.body).toEqual('<xml>abc</xml>');
        expect(ctx.request.rawBody).toEqual('<xml>abc</xml>');
        ctx.body = ctx.request.body;
      });

      await request(app.callback())
        .post('/')
        .type('xml')
        .send('<xml>abc</xml>')
        .expect('<xml>abc</xml>');
    });

    it('should not parse text body when disable', async () => {
      const app = createApp();
      app.use(async (ctx) => {
        expect(ctx.headers['content-type']).toEqual('application/xml');
        ctx.body = ctx.request.body;
      });

      await request(app.callback())
        .post('/')
        .type('xml')
        .send('<xml>abc</xml>')
        .expect({});
    });

    it('should xml body reach the limit size', async () => {
      const app = createApp({
        enableTypes: ['xml'],
        xmlLimit: 10,
      });
      app.use(async (ctx) => {
        expect(ctx.headers['content-type']).toEqual('application/xml');
        ctx.body = ctx.request.body;
      });

      await request(app.callback())
        .post('/')
        .type('xml')
        .send('<xml>abcdefghijklmn</xml>')
        .expect(413);
    });
  });

  describe('html body by text parser', () => {
    it('should parse html body ok', async () => {
      const app = createApp({
        extendTypes: {
          text: ['text/html'],
        },
        enableTypes: ['text'],
      });
      app.use(async (ctx) => {
        expect(ctx.headers['content-type']).toEqual('text/html');
        expect(ctx.request.body).toEqual('<h1>abc</h1>');
        expect(ctx.request.rawBody).toEqual('<h1>abc</h1>');
        ctx.body = ctx.request.body;
      });

      await request(app.callback())
        .post('/')
        .type('html')
        .send('<h1>abc</h1>')
        .expect('<h1>abc</h1>');
    });

    it('should not parse html body when disable', async () => {
      const app = createApp();
      app.use(async (ctx) => {
        expect(ctx.headers['content-type']).toEqual('text/html');
        ctx.body = ctx.request.body;
      });

      await request(app.callback())
        .post('/')
        .type('html')
        .send('<h1>abc</h1>')
        .expect({});
    });
  });

  describe('patchNode', () => {
    it('should patch Node raw request with supported type', async () => {
      const app = createApp({ patchNode: true });

      app.use(async (ctx) => {
        expect(ctx.request.body).toEqual({ foo: 'bar' });
        expect(ctx.request.rawBody).toEqual('{"foo":"bar"}');
        expect(ctx.req.body).toEqual({ foo: 'bar' });
        expect(ctx.req.rawBody).toEqual('{"foo":"bar"}');

        ctx.body = ctx.req.body;
      });

      await request(app.callback())
        .post('/')
        .send({ foo: 'bar' })
        .expect({ foo: 'bar' });
    });

    it('should patch Node raw request with unsupported type', async () => {
      const app = createApp({ patchNode: true });

      app.use(async (ctx) => {
        expect(ctx.request.body).toEqual({});
        expect(ctx.request.rawBody).toEqual(undefined);
        expect(ctx.req.body).toEqual({});
        expect(ctx.req.rawBody).toEqual(undefined);

        ctx.body = ctx.req.body;
      });

      await request(app.callback())
        .post('/')
        .type('application/x-unsupported-type')
        .send('x-unsupported-type')
        .expect({});
    });
  });

  describe('extend type', () => {
    it('should extend json ok', async () => {
      const app = createApp({
        extendTypes: {
          json: ['application/x-javascript'],
        },
      });
      app.use(async (ctx) => {
        ctx.body = ctx.request.body;
      });

      await request(app.callback())
        .post('/')
        .type('application/x-javascript')
        .send(JSON.stringify({ foo: 'bar' }))
        .expect({ foo: 'bar' });
    });

    it('should extend json with array ok', async () => {
      const app = createApp({
        extendTypes: {
          json: ['application/x-javascript', 'application/y-javascript'],
        },
      });
      app.use(async (ctx) => {
        ctx.body = ctx.request.body;
      });

      await request(app.callback())
        .post('/')
        .type('application/x-javascript')
        .send(JSON.stringify({ foo: 'bar' }))
        .expect({ foo: 'bar' });
    });

    it('should extend xml ok', async () => {
      const app = createApp({
        enableTypes: ['xml'],
        extendTypes: {
          xml: ['application/xml-custom'],
        },
      });
      app.use(async (ctx) => {
        ctx.body = ctx.request.body;
      });

      await request(app.callback())
        .post('/')
        .type('application/xml-custom')
        .send('<xml>abc</xml>')
        .expect('<xml>abc</xml>');
    });

    it('should throw when pass unsupported types', () => {
      try {
        createApp({
          extendTypes: {
            'any-other-type': ['application/any-other-type'],
          } as any,
        });
      } catch (error) {
        expect(error instanceof UnsupportedBodyTypeError).toBe(true);
      }
    });

    it('should throw when pass supported types with string value instead of array', () => {
      try {
        createApp({
          extendTypes: {
            'any-other-type': 'application/any-other-type',
          } as any,
        });
      } catch (error) {
        expect(error instanceof UnsupportedBodyTypeError).toBe(true);
      }
    });

    it('should throw when pass supported types with array contain falsy values', () => {
      try {
        createApp({
          extendTypes: {
            json: ['', 0, false, null, undefined],
          } as any,
        });
      } catch (error) {
        expect(error instanceof UnsupportedBodyTypeError).toBe(true);
      }
    });
  });

  describe('enableTypes', () => {
    it('should disable json success', async () => {
      const app = createApp({
        enableTypes: ['form'],
      });

      app.use(async (ctx) => {
        ctx.body = ctx.request.body;
      });

      await request(app.callback())
        .post('/')
        .type('json')
        .send({ foo: 'bar' })
        .expect({});
    });

    it('should throw when pass unsupported types', () => {
      try {
        createApp({
          enableTypes: ['any-other-type' as any],
        });
      } catch (error) {
        expect(error instanceof UnsupportedBodyTypeError).toBe(true);
      }
    });
  });

  describe('other type', () => {
    const app = createApp();

    it('should get body null', async () => {
      app.use(async (ctx) => {
        expect(ctx.request.body).toBeUndefined();
        ctx.body = ctx.request.body;
      });

      await request(app.callback()).get('/').expect({});
    });
  });

  describe('onError', () => {
    const app = createApp({
      onError({}, ctx) {
        ctx.throw(422, 'custom parse error');
      },
    });

    it('should get custom error message', async () => {
      app.use(async () => {});

      await request(app.callback())
        .post('/')
        .send('test')
        .set('content-type', 'application/json')
        .expect(422)
        .expect('custom parse error');
    });
  });

  describe('disableBodyParser', () => {
    it('should not parse body when disableBodyParser set to true', async () => {
      const app = new Koa();
      app.use(async (ctx, next) => {
        ctx.disableBodyParser = true;
        await next();
      });
      app.use(bodyParser());
      app.use(async (ctx) => {
        expect(undefined === ctx.request.rawBody).toEqual(true);
        ctx.body = ctx.request.body ? 'parsed' : 'empty';
      });

      await request(app.callback())
        .post('/')
        .send({ foo: 'bar' })
        .set('content-type', 'application/json')
        .expect(200)
        .expect('empty');
    });
  });

  describe('enableRawChecking', () => {
    it('should override koa request with raw request body if exist and enableRawChecking is truthy', async () => {
      const rawParsedBody = { rawFoo: 'rawBar' };
      const app = createApp({ rawParsedBody, enableRawChecking: true });
      app.use(async (ctx) => {
        ctx.body = ctx.request.body;
      });

      await request(app.callback())
        .post('/')
        .send({ foo: 'bar' })
        .expect(rawParsedBody);
    });

    it("shouldn't override koa request with raw request body if not exist and enableRawChecking is truthy", async () => {
      const rawParsedBody = undefined;
      const app = createApp({ rawParsedBody, enableRawChecking: true });
      app.use(async (ctx) => {
        ctx.body = ctx.request.body;
      });

      await request(app.callback())
        .post('/')
        .send({ foo: 'bar' })
        .expect({ foo: 'bar' });
    });
  });

  describe('request closed', () => {
    it('should return 499 on request closed', async () => {
      const app = new Koa();

      app.use(async (ctx, next) => {
        Object.defineProperty(ctx.req, 'closed', { value: true });
        await next();
      });
      app.use(bodyParser());

      await request(app.callback()).post('/').send({ foo: 'bar' }).expect(499);
    });
  });

  describe('customReviver', () => {
    it('should parse json body with custom reviver function', async () => {
      const app = createApp({
        customReviver: (_key, value) => {
          // Convert all string values to uppercase
          if (typeof value === 'string') {
            return value.toUpperCase();
          }
          return value;
        },
      });

      app.use(async (ctx) => {
        expect(ctx.request.body).toEqual({ foo: 'BAR', nested: { baz: 'QUX' } });
        expect(ctx.request.rawBody).toEqual('{"foo":"bar","nested":{"baz":"qux"}}');
        ctx.body = ctx.request.body;
      });

      await request(app.callback())
        .post('/')
        .send({ foo: 'bar', nested: { baz: 'qux' } })
        .expect({ foo: 'BAR', nested: { baz: 'QUX' } });
    });

    it('should parse json body with custom reviver that filters out certain keys', async () => {
      const app = createApp({
        customReviver: (key, value) => {
          // Filter out keys that start with 'secret'
          if (key && key.startsWith('secret')) {
            return undefined; // This will remove the key
          }
          return value;
        },
      });

      app.use(async (ctx) => {
        expect(ctx.request.body).toEqual({ public: 'data', visible: 'info' });
        expect(ctx.request.rawBody).toEqual('{"public":"data","secretKey":"hidden","visible":"info","secretPassword":"password"}');
        ctx.body = ctx.request.body;
      });

      await request(app.callback())
        .post('/')
        .send({ public: 'data', secretKey: 'hidden', visible: 'info', secretPassword: 'password' })
        .expect({ public: 'data', visible: 'info' });
    });

    it('should parse json body with custom reviver that transforms dates', async () => {
      const app = createApp({
        customReviver: (_key, value) => {
          // Convert ISO date strings to Date objects
          if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
            return new Date(value);
          }
          return value;
        },
      });

      app.use(async (ctx) => {
        const body = ctx.request.body;
        expect(body.name).toBe('test');
        expect(body.createdAt).toBeInstanceOf(Date);
        expect(body.createdAt.getFullYear()).toBe(2023);
        expect(body.updatedAt).toBeInstanceOf(Date);
        expect(body.updatedAt.getMonth()).toBe(11); // December (0-indexed)
        ctx.body = {
          name: body.name,
          createdAt: body.createdAt.toISOString(),
          updatedAt: body.updatedAt.toISOString(),
        };
      });

      await request(app.callback())
        .post('/')
        .send({
          name: 'test',
          createdAt: '2023-01-15T10:30:00Z',
          updatedAt: '2023-12-25T15:45:00Z',
        })
        .expect({
          name: 'test',
          createdAt: '2023-01-15T10:30:00.000Z',
          updatedAt: '2023-12-25T15:45:00.000Z',
        });
    });

    it('should parse json body with custom reviver that handles arrays', async () => {
      const app = createApp({
        customReviver: (_key, value) => {
          // Double all numeric values
          if (typeof value === 'number') {
            return value * 2;
          }
          return value;
        },
      });

      app.use(async (ctx) => {
        expect(ctx.request.body).toEqual({ 
          numbers: [2, 4, 6], 
          mixed: [2, 'text', 6], 
          nested: { value: 8 } 
        });
        ctx.body = ctx.request.body;
      });

      await request(app.callback())
        .post('/')
        .send({ numbers: [1, 2, 3], mixed: [1, 'text', 3], nested: { value: 4 } })
        .expect({ numbers: [2, 4, 6], mixed: [2, 'text', 6], nested: { value: 8 } });
    });

    it('should work with custom reviver and strict mode', async () => {
      const app = createApp({
        jsonStrict: true,
        customReviver: (_key, value) => {
          // Add prefix to all string values
          if (typeof value === 'string') {
            return `PREFIX_${value}`;
          }
          return value;
        },
      });

      app.use(async (ctx) => {
        expect(ctx.request.body).toEqual({ message: 'PREFIX_hello world' });
        ctx.body = ctx.request.body;
      });

      await request(app.callback())
        .post('/')
        .send({ message: 'hello world' })
        .expect({ message: 'PREFIX_hello world' });
    });

    it('should work with custom reviver and non-strict mode', async () => {
      const app = createApp({
        jsonStrict: false,
        customReviver: (_key, value) => {
          // Convert strings to numbers if they look like numbers
          if (typeof value === 'string' && !isNaN(Number(value))) {
            return Number(value);
          }
          return value;
        },
      });

      app.use(async (ctx) => {
        expect(ctx.request.body).toEqual({ count: 42, text: 'hello' });
        ctx.body = ctx.request.body;
      });

      await request(app.callback())
        .post('/')
        .send({ count: '42', text: 'hello' })
        .expect({ count: 42, text: 'hello' });
    });

    it('should handle custom reviver with invalid json gracefully', async () => {
      const app = createApp({
        customReviver: (_key, value) => {
          // This reviver should not be called for invalid JSON
          return value;
        },
      });

      app.use(async (ctx) => {
        ctx.body = 'error handled';
      });

      await request(app.callback())
        .post('/')
        .set('Content-type', 'application/json')
        .send('invalid json {')
        .expect(400);
    });

    it('should not affect form parsing when custom reviver is provided', async () => {
      const app = createApp({
        customReviver: (_key, value) => {
          // This should not affect form parsing
          return value;
        },
      });

      app.use(async (ctx) => {
        expect(ctx.request.body).toEqual({ foo: { bar: 'baz' } });
        expect(ctx.request.rawBody).toEqual('foo%5Bbar%5D=baz');
        ctx.body = ctx.request.body;
      });

      await request(app.callback())
        .post('/')
        .type('form')
        .send({ foo: { bar: 'baz' } })
        .expect({ foo: { bar: 'baz' } });
    });

    it('should not affect text parsing when custom reviver is provided', async () => {
      const app = createApp({
        enableTypes: ['text', 'json'],
        customReviver: (_key, value) => {
          // This should not affect text parsing
          return value;
        },
      });

      app.use(async (ctx) => {
        expect(ctx.request.body).toEqual('plain text');
        expect(ctx.request.rawBody).toEqual('plain text');
        ctx.body = ctx.request.body;
      });

      await request(app.callback())
        .post('/')
        .type('text')
        .send('plain text')
        .expect('plain text');
    });

    it('should work with patchNode option', async () => {
      const app = createApp({
        patchNode: true,
        customReviver: (_key, value) => {
          if (typeof value === 'string') {
            return value.toUpperCase();
          }
          return value;
        },
      });

      app.use(async (ctx) => {
        expect(ctx.request.body).toEqual({ test: 'VALUE' });
        expect(ctx.request.rawBody).toEqual('{"test":"value"}');
        expect(ctx.req.body).toEqual({ test: 'VALUE' });
        expect(ctx.req.rawBody).toEqual('{"test":"value"}');
        ctx.body = ctx.request.body;
      });

      await request(app.callback())
        .post('/')
        .send({ test: 'value' })
        .expect({ test: 'VALUE' });
    });
  });
});
