const isProdEnv = process.env.NODE_ENV === 'production';

module.exports = {
  root: true,
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
    node: true,
  },
  extends: [require.resolve('@dotlim/fabric/lib/eslint')],
  rules: {
    // eslint
    'no-console': isProdEnv ? 'warn' : 'off',
    'no-debugger': isProdEnv ? 'warn' : 'off',
    'no-unused-vars': ['warn', { varsIgnorePattern: '^_' }],
  },
};
