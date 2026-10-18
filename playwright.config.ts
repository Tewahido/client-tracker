import { defineConfig, devices } from '@playwright/test'

// Not 4173: that's `vite preview`'s default, which may be serving a build with real Supabase settings.
const PORT = 4317

/**
 * End-to-end tests (npm run test:e2e). They drive the real app in local mode (no
 * Supabase), each test in a fresh browser profile, on a desktop and a phone viewport.
 */
export default defineConfig({
  testDir: 'e2e/specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: 'en-US',
    timezoneId: 'Africa/Johannesburg',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    // Blank Supabase variables force local mode even if a developer has .env.local set up.
    command: `npx vite --port ${PORT} --strictPort`,
    env: { VITE_SUPABASE_URL: '', VITE_SUPABASE_PUBLISHABLE_KEY: '', VITE_SUPABASE_ANON_KEY: '' },
    url: `http://localhost:${PORT}`,
    // Always start our own local-mode server rather than trusting whatever is on the port.
    reuseExistingServer: false,
    timeout: 60_000,
  },
})
