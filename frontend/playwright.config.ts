import { defineConfig, devices } from '@playwright/test';

/**
 * Two projects:
 *  - `mock`   — starts the built SPA over `vite preview` with deterministic browser
 *               fixtures. Public-route and admin-auth specs (Tasks 14–19) run here.
 *  - `compose` — targets the real Docker Compose stack; enabled in Task 20 by setting
 *               `PLAYWRIGHT_BASE_URL` to the running frontend origin.
 */
const MOCK_PORT = Number(process.env.PLAYWRIGHT_MOCK_PORT ?? 4173);
const composeBaseUrl = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'mock',
      testMatch: /.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://localhost:${MOCK_PORT}`,
      },
    },
    ...(composeBaseUrl
      ? [
          {
            name: 'compose',
            testMatch: /.*\.spec\.ts/,
            use: { ...devices['Desktop Chrome'], baseURL: composeBaseUrl },
          },
        ]
      : []),
  ],
  webServer: composeBaseUrl
    ? undefined
    : {
        command: `npm run build && npm run preview -- --port ${MOCK_PORT} --strictPort`,
        port: MOCK_PORT,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
});
