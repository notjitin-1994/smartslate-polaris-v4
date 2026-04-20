/**
 * Syntax Highlighting Configuration for SmartSlate Polaris Theme
 * Using Shiki with custom theme matching brand colors
 */

import { defineShikiSetup } from '@slidev/types';

export default defineShikiSetup(() => {
  return {
    theme: {
      dark: {
        // Background colors matching glassmorphic design
        bg: '#0d1b2a',
        fg: '#e0e0e0',

        // Token colors using brand palette
        colors: {
          // Comments
          comment: '#7a8a8b',
          'comment.block': '#7a8a8b',
          'comment.line': '#7a8a8b',

          // Keywords and control flow
          keyword: '#a7dadb',
          'keyword.control': '#a7dadb',
          'keyword.operator': '#d0edf0',

          // Variables and identifiers
          variable: '#e0e0e0',
          'variable.parameter': '#b0c5c6',
          'variable.property': '#b0c5c6',

          // Functions
          function: '#7bc5c7',
          'function.call': '#7bc5c7',

          // Strings
          string: '#10b981',
          'string.quoted': '#10b981',

          // Numbers
          'constant.numeric': '#f59e0b',

          // Types and classes
          'entity.name.type': '#7c69f5',
          'entity.name.class': '#7c69f5',

          // Storage (const, let, var, etc.)
          'storage.type': '#4f46e5',
          'storage.modifier': '#4f46e5',

          // Punctuation
          punctuation: '#b0c5c6',
          'punctuation.bracket': '#d0edf0',

          // Operators
          'keyword.operator.logical': '#a7dadb',
          'keyword.operator.arithmetic': '#a7dadb',

          // Tags (HTML/JSX)
          'entity.name.tag': '#7bc5c7',
          'entity.other.attribute-name': '#b0c5c6',

          // Meta (imports, exports)
          'meta.import': '#4f46e5',
          'meta.export': '#4f46e5',

          // Support (built-in functions/types)
          'support.function': '#7c69f5',
          'support.type': '#7c69f5',

          // Constants
          'constant.language': '#f59e0b',

          // Regex
          'string.regexp': '#ef4444',

          // Invalid
          invalid: '#ef4444',
        },
      },
      light: 'github-light',
    },
    langs: [
      'typescript',
      'javascript',
      'tsx',
      'jsx',
      'json',
      'css',
      'html',
      'vue',
      'python',
      'bash',
      'sql',
      'markdown',
      'yaml',
    ],
  };
});
