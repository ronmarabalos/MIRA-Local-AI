/**
 * Shadows and gradients from the design boards, as React Native styles.
 * React Native draws `boxShadow` (including inset) and `backgroundImage`
 * natively on both platforms; Tailwind classes cannot express multi-layer
 * shadows, so components pass these through `style`.
 *
 * The design's backdrop blur is left out on purpose (docs/PLAN.md, B1.4):
 * glass is the translucent fill plus the bright edge.
 */
import type { ViewStyle } from 'react-native';

const shadow = (boxShadow: string): ViewStyle => ({ boxShadow });
const gradient = (backgroundImage: string): ViewStyle => ({ backgroundImage });

export const fx = {
  // Glass surfaces. `glass` is the card variant, `glass2` the panel variant.
  glass: shadow('inset 0 1px 0 rgba(255,255,255,0.9), 0 10px 30px rgba(40,52,100,0.10)'),
  glass2: shadow('inset 0 1px 0 rgba(255,255,255,0.85), 0 10px 30px rgba(40,52,100,0.08)'),
  glassDark: shadow('inset 0 1px 0 rgba(255,255,255,0.14), 0 10px 30px rgba(40,52,100,0.10)'),

  tabBar: shadow('inset 0 1px 0 rgba(255,255,255,0.95), 0 16px 40px rgba(40,52,100,0.18)'),
  tabBarDark: shadow('inset 0 1px 0 rgba(255,255,255,0.14), 0 16px 40px rgba(0,0,0,0.4)'),
  tabActive: shadow('0 8px 18px rgba(28,33,64,0.3)'),

  // Primary navy gradient and its shadows.
  primary: gradient('linear-gradient(180deg, #343F78 0%, #1C2245 100%)'),
  primaryDark: gradient('linear-gradient(180deg, #7C8BE0 0%, #5866C2 100%)'),
  liftLg: shadow('0 12px 28px rgba(40,52,100,0.32)'),
  liftLgStrong: shadow('0 12px 28px rgba(40,52,100,0.35)'),
  liftMd: shadow('0 10px 22px rgba(28,33,64,0.28)'),
  liftMdSoft: shadow('0 10px 22px rgba(40,52,100,0.3)'),
  fab: shadow('0 14px 30px rgba(40,52,100,0.4)'),
  sendBtn: shadow('0 6px 14px rgba(28,33,64,0.3)'),

  // Small lifts.
  knob: shadow('0 2px 6px rgba(28,33,64,0.2)'),
  segment: shadow('0 2px 6px rgba(28,33,64,0.08)'),
  tile: shadow('0 6px 14px rgba(40,52,100,0.08)'),
  avatar: shadow('0 4px 12px rgba(40,52,100,0.18)'),
  avatarDark: shadow('0 4px 12px rgba(0,0,0,0.4)'),
  float: shadow('0 10px 24px rgba(28,33,64,0.08)'),
  floatPill: shadow('0 8px 20px rgba(28,33,64,0.08)'),
  card06: shadow('0 10px 24px rgba(28,33,64,0.06)'),
  panel06: shadow('0 16px 40px rgba(28,33,64,0.06)'),
  panel08: shadow('0 14px 32px rgba(40,52,100,0.08)'),
  panel08b: shadow('0 12px 28px rgba(40,52,100,0.08)'),
  panel08c: shadow('0 14px 34px rgba(40,52,100,0.08)'),
  field: shadow('0 10px 24px rgba(40,52,100,0.06)'),
  phone: shadow('0 20px 50px rgba(28,33,64,0.08)'),
  badge: shadow('0 12px 28px rgba(28,33,64,0.25)'),
  darkCard: shadow('0 20px 44px rgba(28,33,64,0.25)'),
  dialog: shadow('0 30px 60px rgba(28,33,64,0.25)'),

  // Assistant chat.
  bubble: shadow('0 8px 20px rgba(40,52,100,0.10)'),
  chatCard: shadow('0 14px 34px rgba(40,52,100,0.14)'),
  composer: shadow('0 10px 26px rgba(40,52,100,0.10)'),
  chatSheet: {
    ...gradient('linear-gradient(180deg, rgba(240,242,249,0.78) 0%, rgba(232,235,245,0.9) 100%)'),
    ...shadow('0 -16px 40px rgba(40,52,100,0.12)'),
  },

  // Tinted glass.
  approvalsTile: gradient(
    'linear-gradient(155deg, rgba(255,255,255,0.7) 0%, rgba(214,222,255,0.55) 45%, rgba(255,214,226,0.5) 100%)',
  ),
  approvalsTileDark: gradient(
    'linear-gradient(155deg, rgba(255,255,255,0.10) 0%, rgba(150,166,255,0.12) 45%, rgba(255,170,200,0.10) 100%)',
  ),
  summary: gradient('linear-gradient(160deg, rgba(255,255,255,0.72) 0%, rgba(222,228,248,0.5) 100%)'),
  avatarFill: gradient('linear-gradient(160deg, #FFFFFF, #D6DCF2)'),
  progress: gradient('linear-gradient(90deg, #9DAAE6, #2E3A78)'),
  systemSwatch: gradient('linear-gradient(90deg, #DDE2EE 50%, #1C2140 50%)'),
  labelDot: gradient('radial-gradient(circle at 35% 30%, #EEF1FF, #6A79CF)'),

  // Glow blobs inside dark cards.
  glowPeri: gradient('radial-gradient(circle, rgba(92,110,190,0.55) 0%, rgba(92,110,190,0) 68%)'),
  glowMint: gradient('radial-gradient(circle, rgba(104,207,193,0.22) 0%, rgba(104,207,193,0) 70%)'),
  glowSoft: gradient('radial-gradient(circle, rgba(180,192,240,0.4) 0%, rgba(180,192,240,0) 70%)'),
  glowSplash: gradient('radial-gradient(circle, rgba(180,192,240,0.28) 0%, rgba(180,192,240,0) 65%)'),
} satisfies Record<string, ViewStyle>;

/** Screen backgrounds: the silver silk gradient, light and dark. */
export const silk = {
  light: gradient('linear-gradient(180deg, #A7B2CE 0%, #C3CBDF 30%, #DCE0EC 62%, #E9ECF3 100%)'),
  dark: gradient('linear-gradient(180deg, #232A4D 0%, #181C38 40%, #10132A 100%)'),
};
