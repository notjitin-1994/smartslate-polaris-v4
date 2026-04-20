import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript', 'plugin:prettier/recommended'),
  {
    linterOptions: {
      reportUnusedDisableDirectives: false, // Don't warn about unused disable comments
    },
  },
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
      // Exclude embedded demo app from main frontend linting
      'smartslate-polaris/**',
    ],
  },
  {
    files: ['**/*'],
    rules: {
      // Ensure prettier issues are warnings so lint-staged can run prettier after eslint
      'prettier/prettier': 'off', // Handled by pre-commit hooks

      // TypeScript Rules - Pragmatic defaults
      '@typescript-eslint/no-explicit-any': 'off', // Allow any - type safety enforced via code review
      '@typescript-eslint/no-unused-vars': [
        'off', // Turn off - many unused vars are for interface compliance
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      'react-hooks/exhaustive-deps': 'off', // Developers manage deps intentionally

      // React/JSX Rules - Pragmatic for content-heavy apps
      'react/no-unescaped-entities': 'off', // Stylistic - doesn't affect functionality
      'react/jsx-key': 'off', // React will warn at runtime
      'react/display-name': 'off',
      'react/forbid-component-props': 'off', // Allow inline styles for glass effects

      // Import/Export Rules
      'import/no-anonymous-default-export': 'off', // Allow for config objects

      // Next.js Rules
      '@next/next/no-img-element': 'off', // Allow regular img tags where appropriate

      // Style Rules - Off for glass morphism design system
      'no-restricted-syntax': 'off', // Allow inline styles - needed for glass effects and animations
      'no-restricted-properties': 'off', // Allow inline style properties

      // Code Quality
      'prefer-const': 'off', // Let developers choose let vs const
      'no-console': 'off', // Allow console for debugging/logging
    },
  },
  // Test files and fixtures: already covered by global config, kept for documentation
  {
    files: [
      '**/__tests__/**/*.{js,jsx,ts,tsx}',
      '**/*.test.{js,jsx,ts,tsx}',
      '**/test-*.{js,jsx,ts,tsx}',
      'test-*.{js,jsx,ts,tsx}',
      '**/vitest.setup.ts',
      '**/jest.setup.ts',
      '**/*.spec.{js,jsx,ts,tsx}',
      '**/tests/**/*.{js,jsx,ts,tsx}',
      '**/fixtures/**/*.{js,jsx,ts,tsx}',
      '**/fixtures.disabled/**/*.{js,jsx,ts,tsx}',
    ],
    rules: {
      // All rules already off/pragmatic in global config
      '@typescript-eslint/no-unsafe-function-type': 'off',
    },
  },
];

export default eslintConfig;
