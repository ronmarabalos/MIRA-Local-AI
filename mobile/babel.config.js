module.exports = {
  // nativewind/babel compiles `className` and adds the Reanimated (Worklets)
  // plugin, which must stay last. Preset plugins run after these.
  presets: ['module:@react-native/babel-preset', 'nativewind/babel'],
  // chrono-node ships `export * as name from`, which the preset leaves as is.
  plugins: ['@babel/plugin-transform-export-namespace-from'],
};
