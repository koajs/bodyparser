import path from "path";
import request from "supertest";
import Koa from "koa";
import bodyParser from "../src";
import type { BodyParserOptions } from "../src/body-parser.types";
import { UnsupportedBodyTypeError } from "../src/body-parser.utils";

const fixtures = path.join(__dirname, "fixtures");
type CreateAppConfig = BodyParserOptions & {
  rawParsedBody?: Record<string, string>;
};

const createApp = (config: CreateAppConfig = {}) => {
  const { rawParsedBody, ...options } = config;
  const app = new Koa();
  rawParsedBody &&
    app.use((ctx, next) => {
      ctx.req.body = rawParsedBody;
      console.log("==== middelware ====", rawParsedBody);

      return next();
    });

  app.use(bodyParser(options));
  return app;
};

describe("test/body-parser.test.ts", () => {
  let server: ReturnType<ReturnType<typeof createApp>["listen"]>;

  afterEach(() => {
    if (server?.listening) server.close();
  });

  describe("json body", () => {
    let app: ReturnType<typeof createApp>;
    beforeEach(() => {
      app = createApp();
    });

    it("should parse json body ok", (done) => {
      // should work when use body parser again
      app.use(bodyParser());

      app.use(async (ctx) => {
        expect(ctx.request.body).toEqual({ foo: "bar" });
        expect(ctx.request.rawBody).toEqual('{"foo":"bar"}');
        ctx.body = ctx.request.body;
      });
      server = app.listen();
      request(server)
        .post("/")
        .send({ foo: "bar" })
        .expect({ foo: "bar" }, done);
    });

    it("should parse json body with json-api headers ok", (done) => {
      // should work when use body parser again
      app.use(bodyParser());

      app.use(async (ctx) => {
        expect(ctx.request.body).toEqual({ foo: "bar" });
        expect(ctx.request.rawBody).toEqual('{"foo": "bar"}');
        ctx.body = ctx.request.body;
      });
      server = app.listen();
      request(server)
        .post("/")
        .set("Accept", "application/vnd.api+json")
        .set("Content-type", "application/vnd.api+json")
        .send('{"foo": "bar"}')
        .expect({ foo: "bar" }, done);
    });

    it("should parse json patch", (done) => {
      const app = createApp();
      app.use(async (ctx) => {
        expect(ctx.request.body).toEqual([
          { op: "add", path: "/foo", value: "bar" },
        ]);
        expect(ctx.request.rawBody).toEqual(
          '[{"op": "add", "path": "/foo", "value": "bar"}]'
        );
        ctx.body = ctx.request.body;
      });
      server = app.listen();
      request(server)
        .patch("/")
        .set("Content-type", "application/json-patch+json")
        .send('[{"op": "add", "path": "/foo", "value": "bar"}]')
        .expect([{ op: "add", path: "/foo", value: "bar" }], done);
    });

    it("should json body reach the limit size", (done) => {
      const app = createApp({ jsonLimit: 100 });
      app.use(async (ctx) => {
        ctx.body = ctx.request.body;
      });
      server = app.listen();
      request(server)
        .post("/")
        .send(require(path.join(fixtures, "raw.json")))
        .expect(413, done);
    });

    it("should json body error with string in strict mode", (done) => {
      const app = createApp({ jsonLimit: 100 });
      app.use(async (ctx) => {
        expect(ctx.request.rawBody).toEqual('"invalid"');
        ctx.body = ctx.request.body;
      });
      server = app.listen();
      request(server)
        .post("/")
        .set("Content-type", "application/json")
        .send('"invalid"')
        .expect(400, done);
    });

    it("should json body ok with string not in strict mode", (done) => {
      const app = createApp({ jsonLimit: 100, strict: false });
      app.use(async (ctx) => {
        expect(ctx.request.rawBody).toEqual('"valid"');
        ctx.body = ctx.request.body;
      });
      server = app.listen();
      request(server)
        .post("/")
        .set("Content-type", "application/json")
        .send('"valid"')
        .expect(200)
        .expect("valid", done);
    });

    describe("opts.detectJSON", () => {
      it("should parse json body on /foo.json request", (done) => {
        const app = createApp({
          detectJSON(ctx) {
            return /\.json/i.test(ctx.path);
          },
        });

        app.use(async (ctx) => {
          expect(ctx.request.body).toEqual({ foo: "bar" });
          expect(ctx.request.rawBody).toEqual('{"foo":"bar"}');
          ctx.body = ctx.request.body;
        });

        server = app.listen();
        request(server)
          .post("/foo.json")
          .send(JSON.stringify({ foo: "bar" }))
          .expect({ foo: "bar" }, done);
      });

      it("should not parse json body on /foo request", (done) => {
        const app = createApp({
          detectJSON(ctx) {
            return /\.json/i.test(ctx.path);
          },
        });

        app.use(async (ctx) => {
          expect(ctx.request.rawBody).toEqual('{"foo":"bar"}');
          ctx.body = ctx.request.body;
        });

        server = app.listen();
        request(server)
          .post("/foo")
          .send(JSON.stringify({ foo: "bar" }))
          .expect({ '{"foo":"bar"}': "" }, done);
      });
    });
  });

  describe("form body", () => {
    const app = createApp();

    it("should parse form body ok", (done) => {
      app.use(async (ctx) => {
        expect(ctx.request.body).toEqual({ foo: { bar: "baz" } });
        expect(ctx.request.rawBody).toEqual("foo%5Bbar%5D=baz");
        ctx.body = ctx.request.body;
      });
      server = app.listen();
      request(server)
        .post("/")
        .type("form")
        .send({ foo: { bar: "baz" } })
        .expect({ foo: { bar: "baz" } }, done);
    });

    it("should parse form body reach the limit size", (done) => {
      const app = createApp({ formLimit: 10 });
      server = app.listen();
      request(server)
        .post("/")
        .type("form")
        .send({ foo: { bar: "bazzzzzzz" } })
        .expect(413, done);
    });
  });

  describe("text body", () => {
    it("should parse text body ok", (done) => {
      const app = createApp({
        enableTypes: ["text", "json"],
      });
      app.use(async (ctx) => {
        expect(ctx.request.body).toEqual("body");
        expect(ctx.request.rawBody).toEqual("body");
        ctx.body = ctx.request.body;
      });
      server = app.listen();
      request(server).post("/").type("text").send("body").expect("body", done);
    });

    it("should not parse text body when disable", (done) => {
      const app = createApp();
      app.use(async (ctx) => {
        ctx.body = ctx.request.body;
      });
      server = app.listen();
      request(server).post("/").type("text").send("body").expect({}, done);
    });
  });

  describe("xml body", () => {
    it("should parse xml body ok", (done) => {
      const app = createApp({
        enableTypes: ["xml"],
      });
      app.use(async (ctx) => {
        expect(ctx.headers["content-type"]).toEqual("application/xml");
        expect(ctx.request.body).toEqual("<xml>abc</xml>");
        expect(ctx.request.rawBody).toEqual("<xml>abc</xml>");
        ctx.body = ctx.request.body;
      });
      server = app.listen();
      request(server)
        .post("/")
        .type("xml")
        .send("<xml>abc</xml>")
        .expect("<xml>abc</xml>", done);
    });

    it("should not parse text body when disable", (done) => {
      const app = createApp();
      app.use(async (ctx) => {
        expect(ctx.headers["content-type"]).toEqual("application/xml");
        ctx.body = ctx.request.body;
      });
      server = app.listen();
      request(server)
        .post("/")
        .type("xml")
        .send("<xml>abc</xml>")
        .expect({}, done);
    });

    it("should xml body reach the limit size", (done) => {
      const app = createApp({
        enableTypes: ["xml"],
        xmlLimit: 10,
      });
      app.use(async (ctx) => {
        expect(ctx.headers["content-type"]).toEqual("application/xml");
        ctx.body = ctx.request.body;
      });
      server = app.listen();
      request(server)
        .post("/")
        .type("xml")
        .send("<xml>abcdefghijklmn</xml>")
        .expect(413, done);
    });
  });

  describe("html body by text parser", () => {
    it("should parse html body ok", (done) => {
      const app = createApp({
        extendTypes: {
          text: ["text/html"],
        },
        enableTypes: ["text"],
      });
      app.use(async (ctx) => {
        console.log(ctx.request.body);
        expect(ctx.headers["content-type"]).toEqual("text/html");
        expect(ctx.request.body).toEqual("<h1>abc</h1>");
        expect(ctx.request.rawBody).toEqual("<h1>abc</h1>");
        ctx.body = ctx.request.body;
      });
      server = app.listen();
      request(server)
        .post("/")
        .type("html")
        .send("<h1>abc</h1>")
        .expect("<h1>abc</h1>", done);
    });

    it("should not parse html body when disable", (done) => {
      const app = createApp();
      app.use(async (ctx) => {
        expect(ctx.headers["content-type"]).toEqual("text/html");
        ctx.body = ctx.request.body;
      });
      server = app.listen();
      request(server)
        .post("/")
        .type("html")
        .send("<h1>abc</h1>")
        .expect({}, done);
    });
  });

  describe("extend type", () => {
    it("should extend json ok", (done) => {
      const app = createApp({
        extendTypes: {
          json: ["application/x-javascript"],
        },
      });
      app.use(async (ctx) => {
        ctx.body = ctx.request.body;
      });

      server = app.listen();
      request(server)
        .post("/")
        .type("application/x-javascript")
        .send(JSON.stringify({ foo: "bar" }))
        .expect({ foo: "bar" }, done);
    });

    it("should extend json with array ok", (done) => {
      const app = createApp({
        extendTypes: {
          json: ["application/x-javascript", "application/y-javascript"],
        },
      });
      app.use(async (ctx) => {
        ctx.body = ctx.request.body;
      });

      server = app.listen();
      request(server)
        .post("/")
        .type("application/x-javascript")
        .send(JSON.stringify({ foo: "bar" }))
        .expect({ foo: "bar" }, done);
    });

    it("should extend xml ok", (done) => {
      const app = createApp({
        enableTypes: ["xml"],
        extendTypes: {
          xml: ["application/xml-custom"],
        },
      });
      app.use(async (ctx) => {
        ctx.body = ctx.request.body;
      });

      server = app.listen();
      request(server)
        .post("/")
        .type("application/xml-custom")
        .send("<xml>abc</xml>")
        .expect("<xml>abc</xml>", done);
    });

    it("should throw when pass unsupported types", () => {
      try {
        createApp({
          extendTypes: {
            "any-other-type": ["application/any-other-type"],
          } as any,
        });
      } catch (error) {
        expect(error instanceof UnsupportedBodyTypeError).toBe(true);
      }
    });

    it("should throw when pass supported types with string value instead of array", () => {
      try {
        createApp({
          extendTypes: {
            "any-other-type": "application/any-other-type",
          } as any,
        });
      } catch (error) {
        expect(error instanceof UnsupportedBodyTypeError).toBe(true);
      }
    });

    it("should throw when pass supported types with array contain falsy values", () => {
      try {
        createApp({
          extendTypes: {
            json: ["", 0, false, null, undefined],
          } as any,
        });
      } catch (error) {
        expect(error instanceof UnsupportedBodyTypeError).toBe(true);
      }
    });
  });

  describe("enableTypes", () => {
    it("should disable json success", (done) => {
      const app = createApp({
        enableTypes: ["form"],
      });

      app.use(async (ctx) => {
        ctx.body = ctx.request.body;
      });
      server = app.listen();
      request(server)
        .post("/")
        .type("json")
        .send({ foo: "bar" })
        .expect({}, done);
    });

    it("should throw when pass unsupported types", () => {
      try {
        createApp({
          enableTypes: ["any-other-type" as any],
        });
      } catch (error) {
        expect(error instanceof UnsupportedBodyTypeError).toBe(true);
      }
    });
  });

  describe("other type", () => {
    const app = createApp();

    it("should get body null", (done) => {
      app.use(async (ctx) => {
        expect(ctx.request.body).toEqual({});
        ctx.body = ctx.request.body;
      });
      server = app.listen();
      request(server).get("/").expect({}, done);
    });
  });

  describe("onerror", () => {
    const app = createApp({
      onerror({}, ctx) {
        ctx.throw("custom parse error", 422);
      },
    });

    it("should get custom error message", (done) => {
      app.use(async () => {});
      server = app.listen();
      request(server)
        .post("/")
        .send("test")
        .set("content-type", "application/json")
        .expect(422)
        .expect("custom parse error", done);
    });
  });

  describe("disableBodyParser", () => {
    it("should not parse body when disableBodyParser set to true", (done) => {
      const app = new Koa();
      app.use(async (ctx, next) => {
        ctx.disableBodyParser = true;
        await next();
      });
      app.use(bodyParser());
      app.use(async (ctx) => {
        expect(undefined === ctx.request.rawBody).toEqual(true);
        ctx.body = ctx.request.body ? "parsed" : "empty";
      });
      server = app.listen();
      request(server)
        .post("/")
        .send({ foo: "bar" })
        .set("content-type", "application/json")
        .expect(200)
        .expect("empty", done);
    });
  });

  describe("enableRawChecking", () => {
    it("should override koa request with raw request body if exist and enableRawChecking is truthy", (done) => {
      const rawParsedBody = { rawFoo: "rawBar" };
      const app = createApp({ rawParsedBody, enableRawChecking: true });
      app.use(async (ctx) => {
        ctx.body = ctx.request.body;
      });

      server = app.listen();
      request(server)
        .post("/")
        .send({ foo: "bar" })
        .expect(rawParsedBody, done);
    });

    it("shouldn't override koa request with raw request body if not exist and enableRawChecking is truthy", (done) => {
      const rawParsedBody = undefined;
      const app = createApp({ rawParsedBody, enableRawChecking: true });
      app.use(async (ctx) => {
        ctx.body = ctx.request.body;
      });

      server = app.listen();
      request(server)
        .post("/")
        .send({ foo: "bar" })
        .expect({ foo: "bar" }, done);
    });
  });
});
