const playwright = require("@playwright/test");
const { curl, injectPredicate } = require("../../core");

/** @type {typeof playwright.test.describe} */
const describe = playwright.test.describe;

/** @type {typeof playwright.test.step} */
const step = playwright.test.step;

/** @type {typeof playwright.test.expect} */
const expect = playwright.test.expect;

const test = playwright.test.extend({
  async useAnnotation({ }, use, testInfo) {
    await use(async (type, description) => {
      testInfo.annotations.push({ type, description });
    });
  },
  async useStubs({ page }, use, testInfo) {
    await use(async (imports) => {
      const testId =
        testInfo.annotations.find((it) => it.type === "ID")?.description ||
        testInfo.testId;

      await page.setExtraHTTPHeaders({ "x-request-id": testId })
      await page.route("**/*", async (route, request) => {
        route.continue({
          headers: {
            ...request.headers(),
            "X-Request-ID": testId,
          },
        });
      });

      const stubs = await Promise.all(
        imports.map((it) => it.then((module) => module.default))
      );

      await Promise.all(
        stubs.map(({ imposter, ...stub }) => {
          return curl({ port: 2525 }, "POST", `/imposters/${imposter}/stubs`, {
            index: 0,
            // stub,
            stub: injectPredicate(stub, {
              contains: {
                headers: {
                  "X-Request-ID": testId,
                },
              },
            }),
          });
        })
      );
    });
  },
  async usePage({ page }, use) {
    await use((Constructor, ...args) => {
      const pageObject = new Constructor(page, ...args);
      const prototypes = [
        {
          open: () => page.goto(pageObject.pageUrl),
          openWithParameters: (params) => {
            const url = new URL(pageObject.pageUrl, 'http://localhost');
            url.search = new URLSearchParams(params).toString();

            return page.goto(url.href.replace(url.origin, ''));
          }
        },
        pageObject,
        page,
      ];

      return new Proxy(Object.create(null), {
        has: (_, prop) => prototypes.some((obj) => prop in obj),
        get(_, prop, receiver) {
          const obj = prototypes.find((obj) => prop in obj);
          return obj ? Reflect.get(obj, prop, receiver) : void 0;
        },
        set(_, prop, receiver) {
          const obj = prototypes.find((obj) => prop in obj);
          return obj ? Reflect.set(obj, prop, receiver) : false;
        },
        ownKeys() {
          const hash = Object.create(null);
          for (const obj of prototypes) {
            for (const p in obj) {
              if (!hash[p]) {
                hash[p] = true;
              }
            }
          }

          return Object.getOwnPropertyNames(hash);
        },
        preventExtensions: () => false,
        defineProperty: () => false,
      });
    });
  },
})

module.exports = { test, expect, describe, step }
