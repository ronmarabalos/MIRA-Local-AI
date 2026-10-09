module.exports = {
  // nativewind/babel compiles `className` and adds the Reanimated (Worklets)
  // plugin, which must stay last.
  presets: ['module:@react-native/babel-preset', 'nativewind/babel'],
};
