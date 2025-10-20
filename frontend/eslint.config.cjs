const js = require('@eslint/js');
const globals = require('globals');
const typescriptParser = require('@typescript-eslint/parser');
const typescriptPlugin = require('@typescript-eslint/eslint-plugin');
const reactPlugin = require('eslint-plugin-react');
const reactHooksPlugin = require('eslint-plugin-react-hooks');
const localRulesPlugin = require('./.eslint/index.cjs');

module.exports = [
  {
    ignores: ['dist/**', 'node_modules/**', 'eslint.config.js'],
  },
  // Base config for all JavaScript/TypeScript files
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.es2020,
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': typescriptPlugin,
      'react': reactPlugin,
      'react-hooks': reactHooksPlugin,
      'local-rules': localRulesPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // React rules
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      
      // TypeScript rules
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      
      // Design System Enforcement Rules
      'local-rules/no-hardcoded-colors': 'warn',
      'local-rules/no-hardcoded-spacing': 'warn',
    },
  },
  // Override for design token files - allow hardcoded values
  {
    files: [
      '**/design-tokens.ts',
      '**/fluent2-design-system.css',
      '**/fonts.css',
      '**/*.css',
    ],
    rules: {
      'local-rules/no-hardcoded-colors': 'off',
      'local-rules/no-hardcoded-spacing': 'off',
    },
  },
  // Override for test files - allow hardcoded values
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', 'tests/**/*'],
    rules: {
      'local-rules/no-hardcoded-colors': 'off',
      'local-rules/no-hardcoded-spacing': 'off',
    },
  },
];
