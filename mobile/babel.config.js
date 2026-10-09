module.exports = {
  presets: ['module:@react-native/babel-preset'],
  // chrono-node ships `export * as name from`, which the preset leaves as is.
  plugins: ['@babel/plugin-transform-export-namespace-from'],
};
