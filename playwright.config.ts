import { defineConfig, devices } from '@playwright/test'

// Not 4173: that's `vite preview`'s default, which may be serving a build with real Supabase settings.
const LOCAL_PORT = 4317
/** Same app pointed at a fake Supabase project, for the sign-in screens (no network needed). */
const AUTH_PORT = 4318

const AUTH_SPECS = /[\\/]auth[\\/]/

/**
 * End-to-end tests (npm run test:e2e), each test in a fresh browser profile.
 * - desktop / mobile: the app in local mode (no Supabase).
 * - auth: the app in Supabase mode against a fake project, for sign-in behaviour.
 */
export default defineConfig({
  testDir: 'e2e/specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${LOCAL_PORT}`,
    locale: 'en-US',
    timezoneId: 'Africa/Johannesburg',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', testIgnore: AUTH_SPECS, use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', testIgnore: AUTH_SPECS, use: { ...devices['Pixel 7'] } },
    { name: 'auth', testMatch: AUTH_SPECS, use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${AUTH_PORT}` } },
    { name: 'auth-mobile', testMatch: AUTH_SPECS, use: { ...devices['Pixel 7'], baseURL: `http://localhost:${AUTH_PORT}` } },
  ],
  webServer: [
    {
      // Blank Supabase variables force local mode even if a developer has .env.local set up.
      command: `npx vite --port ${LOCAL_PORT} --strictPort`,
      env: { VITE_SUPABASE_URL: '', VITE_SUPABASE_PUBLISHABLE_KEY: '', VITE_SUPABASE_ANON_KEY: '' },
      url: `http://localhost:${LOCAL_PORT}`,
      // Always start our own server rather than trusting whatever is on the port.
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      // A fake (unreachable) project: overrides any real .env.local values for this server.
      command: `npx vite --port ${AUTH_PORT} --strictPort`,
      env: {
        VITE_SUPABASE_URL: 'https://lendly-e2e.supabase.co',
        VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_e2e_fake_key',
        VITE_SUPABASE_ANON_KEY: '',
      },
      url: `http://localhost:${AUTH_PORT}`,
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
})
