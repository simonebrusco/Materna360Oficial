/** ESLint base para Next.js, sem plugins custom e sem bloquear console */
module.exports = {
  root: true,
  extends: ['next/core-web-vitals'],
  parserOptions: { ecmaVersion: 2023, sourceType: 'module' },
  rules: {
    'no-console': 'off',
    '@typescript-eslint/no-var-requires': 'off',
  },
};
