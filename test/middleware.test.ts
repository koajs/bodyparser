import path from "path";
import request from "supertest";
import Koa from "koa";

import bodyParser from "../src";
import { UnsupportedBodyTypeError } from "../src/body-parser.utils";

import { createApp, fixtures } from "./test-utils";

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

    it("should parse json body ok", async () => {
      // should work when use body parser again
      app.use(bodyParser());

      app.use(async (ctx) => {
        expect(ctx.request.body).toEqual({ foo: "bar" });
        expect(ctx.request.rawBody).toEqual('{"foo":"bar"}');
        ctx.body = ctx.request.body;
      });

      server = app.listen();

      await request(server)
        .post("/")
        .send({ foo: "bar" })
        .expect({ foo: "bar" });
    });

    it("should parse json body with json-api headers ok", async () => {
      // should work when use body parser again
      app.use(bodyParser());

      app.use(async (ctx) => {
        expect(ctx.request.body).toEqual({ foo: "bar" });
        expect(ctx.request.rawBody).toEqual('{"foo": "bar"}');
        ctx.body = ctx.request.body;
      });
      server = app.listen();
      await request(server)
        .post("/")
        .set("Accept", "application/vnd.api+json")
        .set("Content-type", "application/vnd.api+json")
        .send('{"foo": "bar"}')
        .expect({ foo: "bar" });
    });

    it.only("should parse json body with `content-type: application/json;charset=utf-8;` headers ok", async () => {
      app.use(bodyParser());

      app.use(async (ctx) => {
        expect(ctx.request.body).toEqual({ foo: "bar" });
        expect(ctx.request.rawBody).toEqual('{"foo": "bar"}');
        ctx.body = ctx.request.body;
      });

      server = app.listen();
      await request(server)
        .post("/")
        .set("Content-type", "application/json;charset=utf-8;")
        .send('{"foo": "bar"}')
        .expect({ foo: "bar" });
    });

    it("should parse json patch", async () => {
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
      await request(server)
        .patch("/")
        .set("Content-type", "application/json-patch+json")
        .send('[{"op": "add", "path": "/foo", "value": "bar"}]')
        .expect([{ op: "add", path: "/foo", value: "bar" }]);
    });

    it("should json body reach the limit size", async () => {
      const app = createApp({ jsonLimit: 100 });
      app.use(async (ctx) => {
        ctx.body = ctx.request.body;
      });
      server = app.listen();
      await request(server)
        .post("/")
        .send(require(path.join(fixtures, "raw.json")))
        .expect(413);
    });

    it("should json body error with string in strict mode", async () => {
      const app = createApp({ jsonLimit: 100 });
      app.use(async (ctx) => {
        expect(ctx.request.rawBody).toEqual('"invalid"');
        ctx.body = ctx.request.body;
      });
      server = app.listen();
      await request(server)
        .post("/")
        .set("Content-type", "application/json")
        .send('"invalid"')
        .expect(400);
    });

    it("should json body ok with string not in strict mode", async () => {
      const app = createApp({ jsonLimit: 100, jsonStrict: false });
      app.use(async (ctx) => {
        expect(ctx.request.rawBody).toEqual('"valid"');
        ctx.body = ctx.request.body;
      });
      server = app.listen();
      await request(server)
        .post("/")
        .set("Content-type", "application/json")
        .send('"valid"')
        .expect(200)
        .expect("valid");
    });

    describe("opts.detectJSON", () => {
      it("should parse json body on /foo.json request", async () => {
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
        await request(server)
          .post("/foo.json")
          .send(JSON.stringify({ foo: "bar" }))
          .expect({ foo: "bar" });
      });

      it("should not parse json body on /foo request", async () => {
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
        await request(server)
          .post("/foo")
          .send(JSON.stringify({ foo: "bar" }))
          .expect({ '{"foo":"bar"}': "" });
      });
    });
  });

  describe("form body", () => {
    const app = createApp();

    it("should parse form body ok", async () => {
      app.use(async (ctx) => {
        expect(ctx.request.body).toEqual({ foo: { bar: "baz" } });
        expect(ctx.request.rawBody).toEqual("foo%5Bbar%5D=baz");
        ctx.body = ctx.request.body;
      });
      server = app.listen();
      await request(server)
        .post("/")
        .type("form")
        .send({ foo: { bar: "baz" } })
        .expect({ foo: { bar: "baz" } });
    });

    it("should parse form body reach the limit size", async () => {
      const app = createApp({ formLimit: 10 });
      server = app.listen();
      await request(server)
        .post("/")
        .type("form")
        .send({ foo: { bar: "bazzzzzzz" } })
        .expect(413);
    });
  });

  describe("text body", () => {
    it("should parse text body ok", async () => {
      const app = createApp({
        enableTypes: ["text", "json"],
      });
      app.use(async (ctx) => {
        expect(ctx.request.body).toEqual("body");
        expect(ctx.request.rawBody).toEqual("body");
        ctx.body = ctx.request.body;
      });
      server = app.listen();
      await request(server).post("/").type("text").send("body").expect("body");
    });

    it("should not parse text body when disable", async () => {
      const app = createApp();
      app.use(async (ctx) => {
        ctx.body = ctx.request.body;
      });
      server = app.listen();
      await request(server).post("/").type("text").send("body").expect({});
    });
  });

  describe("xml body", () => {
    it("should parse xml body ok", async () => {
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
      await request(server)
        .post("/")
        .type("xml")
        .send("<xml>abc</xml>")
        .expect("<xml>abc</xml>");
    });

    it("should not parse text body when disable", async () => {
      const app = createApp();
      app.use(async (ctx) => {
        expect(ctx.headers["content-type"]).toEqual("application/xml");
        ctx.body = ctx.request.body;
      });
      server = app.listen();
      await request(server)
        .post("/")
        .type("xml")
        .send("<xml>abc</xml>")
        .expect({});
    });

    it("should xml body reach the limit size", async () => {
      const app = createApp({
        enableTypes: ["xml"],
        xmlLimit: 10,
      });
      app.use(async (ctx) => {
        expect(ctx.headers["content-type"]).toEqual("application/xml");
        ctx.body = ctx.request.body;
      });
      server = app.listen();
      await request(server)
        .post("/")
        .type("xml")
        .send("<xml>abcdefghijklmn</xml>")
        .expect(413);
    });
  });

  describe("html body by text parser", () => {
    it("should parse html body ok", async () => {
      const app = createApp({
        extendTypes: {
          text: ["text/html"],
        },
        enableTypes: ["text"],
      });
      app.use(async (ctx) => {
        expect(ctx.headers["content-type"]).toEqual("text/html");
        expect(ctx.request.body).toEqual("<h1>abc</h1>");
        expect(ctx.request.rawBody).toEqual("<h1>abc</h1>");
        ctx.body = ctx.request.body;
      });
      server = app.listen();
      await request(server)
        .post("/")
        .type("html")
        .send("<h1>abc</h1>")
        .expect("<h1>abc</h1>");
    });

    it("should not parse html body when disable", async () => {
      const app = createApp();
      app.use(async (ctx) => {
        expect(ctx.headers["content-type"]).toEqual("text/html");
        ctx.body = ctx.request.body;
      });
      server = app.listen();
      await request(server)
        .post("/")
        .type("html")
        .send("<h1>abc</h1>")
        .expect({});
    });
  });

  describe("patchNode", () => {
    it("should patch Node raw request with supported type", async () => {
      const app = createApp({ patchNode: true });

      app.use(async (ctx) => {
        expect(ctx.request.body).toEqual({ foo: "bar" });
        expect(ctx.request.rawBody).toEqual('{"foo":"bar"}');
        expect(ctx.req.body).toEqual({ foo: "bar" });
        expect(ctx.req.rawBody).toEqual('{"foo":"bar"}');

        ctx.body = ctx.req.body;
      });
      server = app.listen();
      await request(server)
        .post("/")
        .send({ foo: "bar" })
        .expect({ foo: "bar" });
    });

    it("should patch Node raw request with unsupported type", async () => {
      const app = createApp({ patchNode: true });

      app.use(async (ctx) => {
        expect(ctx.request.body).toEqual({});
        expect(ctx.request.rawBody).toEqual(undefined);
        expect(ctx.req.body).toEqual({});
        expect(ctx.req.rawBody).toEqual(undefined);

        ctx.body = ctx.req.body;
      });
      server = app.listen();
      await request(server)
        .post("/")
        .type("application/x-unsupported-type")
        .send("x-unsupported-type")
        .expect({});
    });
  });

  describe("extend type", () => {
    it("should extend json ok", async () => {
      const app = createApp({
        extendTypes: {
          json: ["application/x-javascript"],
        },
      });
      app.use(async (ctx) => {
        ctx.body = ctx.request.body;
      });

      server = app.listen();
      await request(server)
        .post("/")
        .type("application/x-javascript")
        .send(JSON.stringify({ foo: "bar" }))
        .expect({ foo: "bar" });
    });

    it("should extend json with array ok", async () => {
      const app = createApp({
        extendTypes: {
          json: ["application/x-javascript", "application/y-javascript"],
        },
      });
      app.use(async (ctx) => {
        ctx.body = ctx.request.body;
      });

      server = app.listen();
      await request(server)
        .post("/")
        .type("application/x-javascript")
        .send(JSON.stringify({ foo: "bar" }))
        .expect({ foo: "bar" });
    });

    it("should extend xml ok", async () => {
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
      await request(server)
        .post("/")
        .type("application/xml-custom")
        .send("<xml>abc</xml>")
        .expect("<xml>abc</xml>");
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
    it("should disable json success", async () => {
      const app = createApp({
        enableTypes: ["form"],
      });

      app.use(async (ctx) => {
        ctx.body = ctx.request.body;
      });
      server = app.listen();
      await request(server)
        .post("/")
        .type("json")
        .send({ foo: "bar" })
        .expect({});
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

    it("should get body null", async () => {
      app.use(async (ctx) => {
        expect(ctx.request.body).toBeUndefined();
        ctx.body = ctx.request.body;
      });
      server = app.listen();
      await request(server).get("/").expect({});
    });
  });

  describe("onError", () => {
    const app = createApp({
      onError({}, ctx) {
        ctx.throw("custom parse error", 422);
      },
    });

    it("should get custom error message", async () => {
      app.use(async () => {});
      server = app.listen();
      await request(server)
        .post("/")
        .send("test")
        .set("content-type", "application/json")
        .expect(422)
        .expect("custom parse error");
    });
  });

  describe("disableBodyParser", () => {
    it("should not parse body when disableBodyParser set to true", async () => {
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
      await request(server)
        .post("/")
        .send({ foo: "bar" })
        .set("content-type", "application/json")
        .expect(200)
        .expect("empty");
    });
  });

  describe("enableRawChecking", () => {
    it("should override koa request with raw request body if exist and enableRawChecking is truthy", async () => {
      const rawParsedBody = { rawFoo: "rawBar" };
      const app = createApp({ rawParsedBody, enableRawChecking: true });
      app.use(async (ctx) => {
        ctx.body = ctx.request.body;
      });

      server = app.listen();
      await request(server)
        .post("/")
        .send({ foo: "bar" })
        .expect(rawParsedBody);
    });

    it("shouldn't override koa request with raw request body if not exist and enableRawChecking is truthy", async () => {
      const rawParsedBody = undefined;
      const app = createApp({ rawParsedBody, enableRawChecking: true });
      app.use(async (ctx) => {
        ctx.body = ctx.request.body;
      });

      server = app.listen();
      await request(server)
        .post("/")
        .send({ foo: "bar" })
        .expect({ foo: "bar" });
    });
  });
});
