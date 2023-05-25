import { PlaywrightTestConfig } from '@playwright/test';
import { MountebankConfig } from './packages/core/index.js';

export * from './packages/tools/index.js';
export * from './packages/test-utils/index.js';

export interface Configuration {
  playwright: PlaywrightTestConfig;
  mountebank: MountebankConfig;
}
