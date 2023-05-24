import { PlaywrightTestConfig } from '@playwright/test'
import * as lib from './packages/tools/src';
import * as test from './packages/test-utils/src';

declare module 'plotwright-alpha' {
    const _exported: typeof lib & typeof test;
    
    type MountebankOptions = {
        host?: string;
        port?: number;
        logLevel?: "debug" | "info" | "warn" | "error";
        debug?: boolean;
        allowInjection?: boolean;
    };

    export interface Configuration {
        playwright: PlaywrightTestConfig;
        mountebank: MountebankOptions & {
            imposters?: string[];
        };
    }

    export = _exported;
}
