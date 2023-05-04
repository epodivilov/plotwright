import type { PlaywrightTestConfig } from "@playwright/test";

export * from "./core";
export * from "./core/page-object";
export { defineConfig, devices } from "@playwright/test";

export type Configuration = {
  mountebank: {
    imposters: string[];
  };
  playwright: PlaywrightTestConfig;
};
