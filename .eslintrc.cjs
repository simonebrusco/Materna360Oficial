const path = require('path')

module.exports = {
  root: true,
  extends: ['next/core-web-vitals'],
  plugins: ['import', 'local', '@typescript-eslint'],
  rules: {
    'import/first': 'error',
    'no-duplicate-imports': 'error',
    '@typescript-eslint/no-redeclare': 'error',
  },
  settings: {
    'import/resolver': {
      node: {
        paths: [path.resolve(__dirname)],
      },
    },
  },
  overrides: [
    {
      files: ['components/**/*.{ts,tsx,js,jsx}'],
      rules: {
        'local/no-client-greeting-prefix': 'error',
      },
    },
  ],
}
