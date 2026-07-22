// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    // react-hooks' "immutability" rule doesn't understand Reanimated's shared values,
    // which are intentionally mutated via `.value =` per Reanimated's own API design.
    // This is a known false-positive against that library, not a real bug.
    rules: {
      'react-hooks/immutability': 'off',
    },
  },
]);
