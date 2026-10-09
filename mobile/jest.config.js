module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['./jest.setup.js'],
  // Metro compiles global.css into styles; tests do not need it.
  moduleNameMapper: { '\\.css$': '<rootDir>/__mocks__/style.js' },
  // React Navigation and NativeWind ship untranspiled modules.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|nativewind|react-native-css-interop)/)',
  ],
};
