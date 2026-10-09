/**
 * MIRA colour tokens, taken from docs/design (board 00-foundations and the
 * screen boards). The single source for both Tailwind classes
 * (tailwind.config.js) and values passed to SVG or style props in code.
 */
module.exports = {
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // Screen background (the gradient itself lives in theme/effects.ts).
  silk: { top: '#A7B2CE', mid: '#C3CBDF', base: '#E9ECF3', ring: '#EEF1F8' },

  // Text on light surfaces.
  ink: {
    DEFAULT: '#1C2140',
    2: '#465071', // secondary
    body: '#343B5C', // body on glass
    muted: '#515A7A', // timestamps, hints
    label: '#444C6C', // section labels, neutral chips
    soft: '#3E4769', // light display subtitles
    deep: '#2A3150', // long-form reading text
    faint: '#9AA3BE',
    placeholder: '#7C829C',
    outside: '#B9B6CC', // calendar days outside the month
  },

  navy: {
    DEFAULT: '#2E3A78', // primary action, links
    pressed: '#232C5E', // pressed, text on tonal
    night: '#12152A',
    top: '#343F78', // primary gradient top
    bottom: '#1C2245', // primary gradient bottom
  },

  peri: {
    DEFAULT: '#98A5E4',
    600: '#6A79CF', // focus ring, selected outline
    400: '#9DAAE6',
    300: '#BCC6EA', // field borders, connectors
    200: '#C9D1EC', // dashed outlines
    150: '#CDD4EB', // inactive steps
    track: '#B9C0D6', // switch off
    disabled: '#AEB5CC',
    swatch: '#DDE2EE',
    mist: '#CBD2EA', // secondary text on ink cards
    tonal: 'rgba(222,228,250,0.85)',
  },

  mint: {
    DEFAULT: '#68CFC1',
    ink: '#1E7F73',
    bg: '#E2F6F3',
    deep: '#15544C',
    glow: '#8FE3D7',
  },
  success: { DEFAULT: '#34A889', ink: '#1F7A62', bg: '#E3F5EF' },
  warning: {
    DEFAULT: '#E8AD59',
    ink: '#8A5A12',
    bg: '#FCF1E0',
    text: '#6B4510',
    line: '#F5DEB9',
    panel: '#FFF8EE',
  },
  error: {
    DEFAULT: '#DD6B78',
    ink: '#B23A4A',
    bg: '#FBE9EB',
    line: '#F3CDD2',
    deep: '#8E2A38',
  },
  outlook: { ink: '#2F55A4', bg: '#E8EEFB' },

  // Dark theme, from board 05b-home-dark.
  dk: {
    bg: '#12152A',
    raised: '#181C38',
    text: '#EEF0FA',
    text2: '#C3C8E2',
    text3: '#B4BAD6',
    muted: '#A5ACC9',
    label: '#B5BBD5',
    action: '#7C8BE0',
    actionBottom: '#5866C2',
    accent: '#B9C3FA',
    mint: '#7FDCCF',
    mintBg: '#163A36',
    success: '#6FD3B0',
    successBg: '#173A30',
    warning: '#F0C27F',
    chip: '#E6E9F8',
  },
};
