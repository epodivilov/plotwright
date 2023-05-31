// @ts-expect-error
import mb from 'mountebank';
import * as http from 'http';
import * as path from 'path';
import { existsSync } from 'fs';
import * as fs from 'fs/promises';
import { spawn } from 'child_process';
import { PlaywrightTestConfig } from '@playwright/test';
import { clearLine, cursorTo } from "readline";
import serialize from 'serialize-javascript'

function curl(options: any, method: "POST" | "GET" | "PUT" | "DELETE", path: string, data: any) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      method: method,
      path: path,
      port: options.port,
      hostname: options.host || 'localhost',
      headers: {
        'Content-Type': 'application/json',
        Connection: 'close'
      }
    };

    if (options.apikey) {
      // @ts-expect-error
      requestOptions.headers['x-api-key'] = options.apikey;
    }

    const request = http.request(requestOptions, response => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', chunk => { body += chunk; });
      response.on('end', () => {
        if (response.statusCode === 200) {
          resolve({ ...response, body: JSON.parse(body) });
        }
        else {
          reject(new Error(`${response.statusCode}\n${body}`));
        }
      });
    });

    request.on('error', reject);

    if (data) {
      request.write(JSON.stringify(data, null, 2));
    }
    request.end();
  });
}

function log(message: string) {
  clearLine(process.stdout, 0);
  cursorTo(process.stdout, 0);
  process.stdout.write(message);
}

export type MountebankConfig = {
  host?: string;
  port?: number;
  logLevel?: "debug" | "info" | "warn" | "error";
  debug?: boolean;
  allowInjection?: boolean;
  log: any;
} & {
  imposters?: string[];
};

async function startMountebank({ imposters = [], tempDir, ...config }: MountebankConfig & { tempDir: string }) {
  const mbOptions = {
    port: 2525,
    allowInjection: true,
    ...config,
    log: {
      transports: {
        file: {
          path: path.resolve(tempDir, 'mb.log'),
          format: 'json'
        }
      },
      ...config.log,
    }
  };

  log(`Mountebank: starting 🔄`);
  const { close } = await mb.create(mbOptions);

  log(`Mountebank: loading imposters 🔄`);
  const body = await Promise.all(imposters.map(async (path) => {
    const data = await fs.readFile(path, 'utf-8');
    return JSON.parse(data);
  }))

  await curl(mbOptions, 'PUT', '/imposters', {
    imposters: body
  });
  log(`Mountebank: started ✅\n`)

  return (onClose?: () => void) => new Promise<void>((resolve) => {
    log(`Mountebank: stopping 🔄`)
    return close(() => {
      log(`Mountebank: stopped ✅\n`)
      if (typeof onClose === 'function') {
        onClose();
      }
      resolve();
    });
  })
}

async function startPlaywright({ tempDir, ...config }: PlaywrightTestConfig & { tempDir: string }) {
  log(`Playwright: preparing 🔄`);

  const configFile = path.join(tempDir, 'playwright.config.js');

  await fs.writeFile(configFile, `import { defineConfig, devices } from "@playwright/test";
  export default defineConfig(${serialize(config, { space: 2 })});`);

  return new Promise((resolve) => {
    log(`Playwright: starting 🔄`);
    const playwrightExecutable = path.join(process.cwd(), './node_modules/.bin/playwright');
    const playwright = spawn('node', [playwrightExecutable, 'test', '--config', configFile]);
    log(`Playwright: started ✅\n`);

    playwright.stdout.pipe(process.stdout);
    playwright.stderr.pipe(process.stderr);

    playwright.on('exit', (code) => {
      log(`Playwright: finished ${code !== 0 ? '❌' : '✅'}\n`);
      return resolve(code);
    });
  })
}

async function showPlaywrightReport({ outputDir }: PlaywrightTestConfig) {
  return new Promise((resolve) => {
    const reportDir = path.resolve(process.cwd(), outputDir!);
    const playwrightExecutable = path.join(process.cwd(), './node_modules/.bin/playwright');
    const playwright = spawn('node', [playwrightExecutable, 'show-report', reportDir]);
    playwright.stdout.pipe(process.stdout);
    playwright.stderr.pipe(process.stderr);
    playwright.on('exit', resolve);
  })
}

type Stub = {
  imposter: number;
  predicates?: Array<{
    contains?: {
      path?: string;
      headers?: Record<string, string>;
    };
  }>;
  responses?: Array<{
    is: {
      statusCode: number;
      body: Record<string, any>;
    };
    behaviors: Array<{
      wait?: number;
    }>;
  }>;
};
function injectPredicate(stub: Stub, predicate: Record<string, any>) {
  const { predicates = [], ...rest } = stub;

  return {
    ...rest,
    predicates: [
      {
        and: [...predicates, predicate],
      },
    ],
  };
}

async function importConfig(configPath: string) {
  const configPathResolved = path.resolve(process.cwd(), configPath);

  if (!existsSync(configPathResolved)) {
    console.error(`Config file at ${configPathResolved} does not exist.`);
    process.exit(1);
  }

  const { default: { mountebank, playwright } } = await import(configPathResolved);

  return { mountebank, playwright };
}

export { curl, log, startMountebank, startPlaywright, showPlaywrightReport, injectPredicate, importConfig }
