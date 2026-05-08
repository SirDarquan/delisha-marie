import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['projects/admin-delisha-marie/src/api/**/*.test.ts'],
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['lcov'],
      reportsDirectory: 'coverage/admin-delisha-marie-api',
    },
  },
});
