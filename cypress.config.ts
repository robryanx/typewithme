import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://127.0.0.1:8000',
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    // No global setup is needed, so there is no cypress/support/e2e file.
    supportFile: false,
  },
});
