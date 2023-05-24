#!/usr/bin/env node

import { writeFile, mkdtemp, rmdir } from 'fs/promises';
import { join } from 'path';
import { Command } from 'commander';

import { startPlaywright, startMountebank, showPlaywrightReport, importConfig, log } from "../../packages/core/index.js";

const program = new Command();

program
  .command('init')
  .description('Create a base configuration file')
  .action(async () => {
    await writeFile('plotwright.config.js', [
      `/** @type {import('plotwright').Configuration} */`,
      `module.exports = {}`
    ].join('\n'));
    log('Default configuration created successfully! 🎉\n')
  });

program
  .command('test')
  .description('Run tests')
  .option('-c, --config <path>', 'Path to config file', 'plotwright.config.js')
  .action(async ({ config }) => {
    const { mountebank, playwright } = await importConfig(config);

    const tempDir = await mkdtemp(join(process.cwd(), '.plotwright-'));

    /* Mountebank start */
    const stopMountebank = await startMountebank({ ...mountebank, tempDir });
    /* Mountebank end */

    /* Playwright start */
    const exitCode = await startPlaywright({ ...playwright, tempDir });
    /* Playwright end */

    await stopMountebank();

    if (exitCode === 0) {
      /* Remove temp dir if no errors */
      await rmdir(tempDir, { recursive: true });
    }

    process.exit(exitCode);
  });

program
  .command('report')
  .description('Display the results')
  .option('-c, --config <path>', 'Path to config file', 'plotwright.config.js')
  .action(async ({ config }) => {
    const { playwright } = await importConfig(config);

    await showPlaywrightReport(playwright)
  });

program.parse(process.argv);
