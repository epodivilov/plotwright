import { test as base } from "@playwright/test";
import type { Page as BasePage } from "@playwright/test";
import { curl, injectPredicate } from "../utils";

export * from "@playwright/test";

export const describe = base.describe;
export const step = base.step;
export const expect = base.expect;

type ConstructorArgs<T, P, A extends any[]> = new (page: P, ...args: A) => T;

type ExtendedTest = {
  useAnnotation: (type: string, description: string) => Promise<void>;
  useStubs: (stubs: Promise<any>[]) => Promise<void>;
  usePage: <T extends { url: string }, A extends any[]>(
    Constructor: ConstructorArgs<T, BasePage, A>,
    ...args: A
  ) => BasePage & T & { open: () => Promise<void> };
};
export const test = base.extend<ExtendedTest>({
  async useAnnotation({}, use, testInfo) {
    await use(async (type, description) => {
      testInfo.annotations.push({ type, description });
    });
  },
  async useStubs({ page }, use, testInfo) {
    await use(async (imports) => {
      const testId =
        testInfo.annotations.find((it) => it.type === "ID")?.description ||
        testInfo.testId;

      await page.route("/**/*", (route, request) => {
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
        { open: () => page.goto(pageObject.url) },
        pageObject,
        page,
      ];

      return new Proxy(Object.create(null), {
        has: (_, prop) => prototypes.some((obj) => prop in obj),
        get(_, prop, receiver) {
          const obj = prototypes.find((obj) => prop in obj);
          return obj ? Reflect.get(obj, prop, receiver) : void 0;
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
});
