import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'coverage/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/**',
        '**/.next/**',
        '**/.vercel/**',
        '**/scripts/**',
        '**/migrations/**',
        'vitest.config.ts',
        'vitest.setup.ts',
      ],
      include: [
        'app/**/*.{js,ts,jsx,tsx}',
        'lib/**/*.{js,ts,jsx,tsx}',
        'components/**/*.{js,ts,jsx,tsx}',
        'types/**/*.{js,ts,jsx,tsx}',
        'utils/**/*.{js,ts,jsx,tsx}',
      ],
      thresholds: {
        global: {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90,
        },
        // Critical paths need higher coverage
        'app/api/**': {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95,
        },
        'lib/services/**': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90,
        },
      },
    },
    // Performance and concurrency settings
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 4,
        minThreads: 1,
      },
    },
    // Test organization
    include: [
      '**/__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      '**/tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    exclude: [
      'node_modules/',
      'dist/',
      '.next/',
      '.vercel/',
      'coverage/',
      'scripts/',
      'migrations/',
      '__tests__/e2e/',
    ],
    // Global test timeout
    testTimeout: 30000,
    hookTimeout: 15000,
    // Verbose output for better debugging - use reporter instead
    // verbose: true, // Not supported in vitest config
    // Watch mode settings
    watch: false,
    // Isolate tests for consistency
    isolate: true,
    // Clear mocks between tests
    clearMocks: true,
    // Restore mocks after each test
    restoreMocks: true,
    // Environment variables for testing
    env: {
      NODE_ENV: 'test',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
      GOOGLE_GENERATIVE_AI_API_KEY: 'test-anthropic-key',
      NEXT_PUBLIC_ENABLE_PAYMENTS: 'true',
      NEXT_PUBLIC_RAZORPAY_KEY_ID: 'test-razorpay-key-id',
      RAZORPAY_KEY_SECRET: 'test-razorpay-secret',
      RAZORPAY_WEBHOOK_SECRET: 'test-webhook-secret',
    },
  },
  resolve: {
    alias: {
      '@': __dirname,
    },
  },
  esbuild: {
    jsxInject: 'import React from "react"',
  },
  // Define global constants for tests
  define: {
    'process.env.NODE_ENV': '"test"',
  },
});
