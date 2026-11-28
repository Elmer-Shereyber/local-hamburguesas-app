import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    exclude: ['tests/integration/**', 'e2e/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: [
        'public/shared/*-rules.js',
        'public/shared/utils.js'
      ],
      exclude: [
        'public/shared/firebase-config.js',
        'public/shared/db.js',
        'public/shared/auth.js'
      ],
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 90,
        lines: 90
      }
    }
  }
});
