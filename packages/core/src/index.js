const mb = require('mountebank');
const http = require('http');
const path = require('path');
const { existsSync } = require('fs');
const fs = require('fs/promises');
const { spawn } = require('child_process');

/**
 * @param {any} options 
 * @param {"POST"|"GET"|"PUT"|"DELETE"} method 
 * @param {string} path 
 * @param {any} data 
 * @returns 
 */
function curl(options, method, path, data) {
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

/**
 * @param {string} message 
 */
function log(message) {
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  process.stdout.write(message);
}

async function startMountebank({ imposters, tempDir, ...config }) {
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

  return (onClose) => new Promise((resolve) => {
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

async function startPlaywright({ tempDir, ...config }) {
  log(`Playwright: preparing 🔄`);

  const configFile = path.join(tempDir, 'playwright.config.js');

  await fs.writeFile(configFile, `import { defineConfig, devices } from "@playwright/test";
  export default defineConfig(${JSON.stringify(config, null, 2)});`);

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

async function showPlaywrightReport({ outputFolder }) {
  return new Promise((resolve) => {
    const reportDir = path.resolve(process.cwd(), outputFolder);
    const playwrightExecutable = path.join(process.cwd(), './node_modules/.bin/playwright');
    const playwright = spawn('node', [playwrightExecutable, 'show-report', reportDir]);
    playwright.stdout.pipe(process.stdout);
    playwright.stderr.pipe(process.stderr);
    playwright.on('exit', resolve);
  })
}

function injectPredicate(stub, predicate) {
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

async function importConfig(configPath) {
  const configPathResolved = path.resolve(process.cwd(), configPath);

  if (!existsSync(configPathResolved)) {
    console.error(`Config file at ${configPathResolved} does not exist.`);
    process.exit(1);
  }

  const { default: { mountebank, playwright } } = await import(configPathResolved);

  return { mountebank, playwright };
}

module.exports = { curl, log, startMountebank, startPlaywright, showPlaywrightReport, injectPredicate, importConfig }