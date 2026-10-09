/**
 * Tailwind for React Native (NativeWind). Spacing, sizes, radii, and type
 * sizes are in plain pixels, so classes read like the design boards:
 * `p-14` is 14px, `rounded-22` is 22px, `text-15` is 15px.
 *
 * Weights map to the bundled Onest files (`font-semibold` is Onest-SemiBold),
 * never to fontWeight, which makes Android and iOS fall back to system fonts.
 */
const palette = require('./src/theme/palette');

const px = (max) =>
  Object.fromEntries(
    Array.from({ length: max + 1 }, (_, i) => [String(i), `${i}px`]),
  );

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    colors: palette,
    spacing: { ...px(420), px: '1px' },
    borderRadius: { ...px(40), none: '0px', full: '9999px' },
    fontSize: px(48),
    lineHeight: px(48),
    fontFamily: {
      light: ['Onest-Light'],
      normal: ['Onest-Regular'],
      medium: ['Onest-Medium'],
      semibold: ['Onest-SemiBold'],
      bold: ['Onest-Bold'],
    },
    fontWeight: {},
    extend: {
      opacity: {
        6: '0.06',
        7: '0.07',
        8: '0.08',
        12: '0.12',
        14: '0.14',
        18: '0.18',
        42: '0.42',
        46: '0.46',
        72: '0.72',
        78: '0.78',
        86: '0.86',
        88: '0.88',
        92: '0.92',
      },
    },
  },
  plugins: [],
};
