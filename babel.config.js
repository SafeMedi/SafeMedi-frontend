module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: ['@tamagui/babel-plugin', 'expo-router/babel', 'react-native-reanimated/plugin'],
  };
};
