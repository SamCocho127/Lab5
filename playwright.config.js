var { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 90000,
  expect: {
    timeout: 15000
  },
  use: {
    baseURL: 'http://127.0.0.1:3010',
    headless: false,
    viewport: { width: 1100, height: 700 },
    launchOptions: {
      slowMo: 1000
    }
  },
  webServer: {
    command: 'node server.js',
    url: 'http://127.0.0.1:3010',
    env: {
      PORT: '3010'
    },
    reuseExistingServer: false,
    timeout: 30000
  }
});
