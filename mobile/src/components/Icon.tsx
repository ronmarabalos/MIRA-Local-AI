/**
 * Every icon used on the boards: 24-unit line icons drawn with the current
 * colour. Use `name` for a named glyph or `d` for a raw path from the boards.
 */
import type { ReactElement } from 'react';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

import palette from '../theme/palette';

/** Path data that boards pass around as values. */
export const D = {
  mail: 'M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM4 7l8 6 8-6',
  calendar: 'M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM8 3v4M16 3v4M3 11h18',
  bulb: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2',
  check: 'm5 12 5 5 9-10',
  x: 'M6 6l12 12M18 6 6 18',
  plus: 'M12 5v14M5 12h14',
  bolt: 'M13 3 4 14h7l-1 7 9-11h-7z',
  bell: 'M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 20a2 2 0 0 0 4 0',
  shield: 'M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z',
  shieldAlert: 'M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6zM12 9v3M12 15h.01',
  refresh: 'M20 11a8 8 0 0 0-14.5-4.5L4 8M4 4v4h4M4 13a8 8 0 0 0 14.5 4.5L20 16M20 20v-4h-4',
  phoneOutline: 'M7 3h10v18H7zM11 18h2',
  pencil: 'M4 20h4L19 9l-4-4L4 16z',
  info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 8v5M12 16h.01',
  wifiOffShort: 'M2 2l20 20M8.5 16.5a5 5 0 0 1 7 0',
  chevronUp: 'm6 15 6-6 6 6',
  chevronDown: 'm6 9 6 6 6-6',
};

const ICONS = {
  back: <Path d="m15 6-6 6 6 6" />,
  chevronRight: <Path d="m9 6 6 6-6 6" />,
  chevronLeft: <Path d="m15 6-6 6 6 6" />,
  bell: <Path d={D.bell} />,
  home: <Path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  mail: (
    <>
      <Rect x="3" y="5" width="18" height="14" rx="3" />
      <Path d="m4 7 8 6 8-6" />
    </>
  ),
  bulb: <Path d={D.bulb} />,
  planner: (
    <>
      <Rect x="3" y="5" width="18" height="16" rx="3" />
      <Path d="M8 3v4M16 3v4M3 10h18M9 15l2 2 4-4" />
    </>
  ),
  calendar: (
    <>
      <Rect x="3" y="5" width="18" height="16" rx="3" />
      <Path d="M8 3v4M16 3v4M3 10h18" />
    </>
  ),
  calendarSmall: (
    <>
      <Rect x="3" y="5" width="18" height="16" rx="3" />
      <Path d="M3 10h18" />
    </>
  ),
  checkCircle: (
    <>
      <Circle cx="12" cy="12" r="9" />
      <Path d="m8 12 3 3 5-6" />
    </>
  ),
  check: <Path d={D.check} />,
  shield: <Path d={D.shield} />,
  shieldCheck: (
    <>
      <Path d={D.shield} />
      <Path d="m9 12 2 2 4-4" />
    </>
  ),
  clock: (
    <>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M12 7v5l3 2" />
    </>
  ),
  bolt: <Path d={D.bolt} />,
  x: <Path d={D.x} />,
  plus: <Path d={D.plus} />,
  pencil: <Path d={D.pencil} />,
  mic: (
    <>
      <Rect x="9" y="3" width="6" height="11" rx="3" />
      <Path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </>
  ),
  arrowRight: <Path d="M5 12h13M13 6l6 6-6 6" />,
  arrowDown: <Path d="M12 5v14M6 13l6 6 6-6" />,
  arrowUp: <Path d="M12 19V5M6 11l6-6 6 6" />,
  wifiOff: <Path d="M2 2l20 20M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 5.2-2.8M19 13a10 10 0 0 0-2-1.5M12 20h.01" />,
  wifiOffShort: <Path d="M2 2l20 20M8.5 16.5a5 5 0 0 1 7 0M12 20h.01" />,
  lock: (
    <>
      <Rect x="5" y="11" width="14" height="10" rx="2" />
      <Path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),
  phone: (
    <>
      <Rect x="7" y="3" width="10" height="18" rx="2" />
      <Path d="M11 18h2" />
    </>
  ),
  phoneBare: <Rect x="7" y="3" width="10" height="18" rx="2" />,
  link: <Path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />,
  camera: (
    <>
      <Path d="M4 8h3l2-3h6l2 3h3v11H4z" />
      <Circle cx="12" cy="13" r="3.5" />
    </>
  ),
  info: (
    <>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M12 8v5M12 16h.01" />
    </>
  ),
  download: <Path d="M12 4v11M7 10l5 5 5-5M5 20h14" />,
  history: <Path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2" />,
  chat: (
    <>
      <Path d="M4 5h16v11H8l-4 4z" />
      <Path d="M8 9h8M8 12h5" />
    </>
  ),
  example: (
    <>
      <Rect x="3" y="4" width="8" height="16" rx="2" />
      <Rect x="13" y="4" width="8" height="16" rx="2" />
      <Path d="M6 8h2M16 8h2M6 12h2M16 12h2" />
    </>
  ),
  refresh: <Path d={D.refresh} />,
  sun: (
    <>
      <Circle cx="12" cy="12" r="4" />
      <Path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5" />
    </>
  ),
  search: (
    <>
      <Circle cx="11" cy="11" r="7" />
      <Path d="m20 20-3.5-3.5" />
    </>
  ),
  trash: <Path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />,
  file: (
    <>
      <Path d="M14 3H6v18h12V7z" />
      <Path d="M14 3v4h4" />
    </>
  ),
  lines: <Path d="M4 6h16M4 12h10M4 18h7" />,
  repeat: <Path d="M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3" />,
  cloud: <Path d="M7 18h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 9a4.5 4.5 0 0 0 1 9z" />,
  sliders: (
    <>
      <Path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
      <Circle cx="16" cy="6" r="2" />
      <Circle cx="10" cy="12" r="2" />
      <Circle cx="18" cy="18" r="2" />
    </>
  ),
  gear: (
    <>
      <Circle cx="12" cy="12" r="3" />
      <Path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </>
  ),
  user: (
    <>
      <Circle cx="12" cy="8" r="4" />
      <Path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  bookmark: <Path d="M6 3h12v18l-6-4-6 4z" />,
  help: (
    <>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6M12 17h.01" />
    </>
  ),
} satisfies Record<string, ReactElement>;

export type IconName = keyof typeof ICONS;

type Props = {
  name?: IconName;
  d?: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

export function Icon({ name, d, size = 20, color = palette.ink.DEFAULT, strokeWidth = 2 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <G stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none">
        {d ? <Path d={d} /> : name ? ICONS[name] : null}
      </G>
    </Svg>
  );
}

/** The filled three-dot "More" glyph. */
export function DotsIcon({ size = 19, color = palette.ink.DEFAULT }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Circle cx="5" cy="12" r="1.7" />
      <Circle cx="12" cy="12" r="1.7" />
      <Circle cx="19" cy="12" r="1.7" />
    </Svg>
  );
}
