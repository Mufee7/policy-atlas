import {defineConfig} from '@playwright/test';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';

if (existsSync('.tools/playwright')) {
  process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve('.tools/playwright');
}

export default defineConfig({
  testDir: './tests/browser',
  workers: 1,
  retries: 0,
  timeout: 120_000,
  expect: {timeout: 15_000},
  outputDir: 'outputs/playwright',
  reporter: [['list']],
  webServer: {
    command: 'node scripts/run-framework.mjs dev',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  use: {
    baseURL: 'http://127.0.0.1:5173',
    browserName: 'chromium',
    channel: 'chromium',
    headless: false,
    launchOptions: {slowMo: 800},
    video: 'on',
    viewport: {width: 1440, height: 1000},
    actionTimeout: 15_000,
    screenshot: 'only-on-failure',
  },
});
