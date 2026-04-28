import { defineConfig } from 'oxlint'

export default defineConfig({
  ignorePatterns: ['dist', 'src/types/api-generated.ts'],
  plugins: ['typescript', 'react', 'oxc'],
  jsPlugins: ['eslint-plugin-react-refresh'],
  categories: {
    correctness: 'error',
  },
  rules: {
    'typescript/no-explicit-any': 'warn',
    'no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      },
    ],
    'react/exhaustive-deps': 'warn',
    'react/rules-of-hooks': 'error',
    'react-refresh/only-export-components': [
      'warn',
      {
        allowConstantExport: true,
      },
    ],
  },
  overrides: [
    {
      files: ['src/test/**/*.{ts,tsx}'],
      rules: {
        'react-refresh/only-export-components': 'off',
      },
    },
  ],
  env: {
    browser: true,
    builtin: true,
    es2020: true,
  },
})
