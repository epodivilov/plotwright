import type { PlaywrightTestConfig } from "@playwright/test";

export * from "./core";
export * from "./core/page-object";
export { defineConfig, devices } from "@playwright/test";

type MountebankOptions = {
  host?: string;
  port?: number;
  logLevel?: "debug" | "info" | "warn" | "error";
  debug?: boolean;
  allowInjection?: boolean;
};

export type Configuration = {
  mountebank?: MountebankOptions & {
    imposters?: string[];
  };
  playwright?: PlaywrightTestConfig;
};

export function makeConfig(config: Configuration): Configuration {
  return {
    mountebank: config.mountebank || {},
    playwright: config.playwright || {},
  };
}
