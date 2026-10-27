import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    silent: true,
    onConsoleLog() {
      return false;
    },
    setupFiles: ['test/vitest.setup.ts'],
    coverage: {
      reportsDirectory: 'coverage/delisha-marie-api',
    },
  },
});
