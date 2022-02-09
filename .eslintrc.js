module.exports = {
  env: {
    browser: true,
    node: true,
    commonjs: true,
    es2021: true,
  },
  extends: [
    'airbnb-base',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: {
    "no-console": 0,
    eqeqeq: 0,
    "max-len": [2, {"code": 168, "ignoreUrls": true}],
    "no-await-in-loop": 0,
    "no-mixed-operators": 0,
  },
};
