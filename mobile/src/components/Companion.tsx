/**
 * MIRA, the companion (`Mira-lbou` on the boards). The design file references
 * the component but does not ship it, so it is built from the five states in
 * board 00-foundations and the keyframes the boards define:
 *   idle        breathes (m-breathe) and blinks now and then (m-blink)
 *   listening   leans in (m-swell) with level bars (m-lvl)
 *   thinking    eyes sweep (m-scan) with a slight tilt (m-tilt)
 *   responding  one nod, then still (m-nod)
 *   offline     idle plus the on-device home mark
 * The body is the pearl-and-periwinkle glass orb from board 00-orb-styles.
 * Sizes of 52 and up reserve 20% extra height for the ground shadow, as the
 * boards' hint sizes do (56 x 67, 140 x 168).
 */
import { Animated, Easing, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import palette from '../theme/palette';
import { pingPong, useLoop, useMotion } from './motion';

export type CompanionMode = 'idle' | 'listening' | 'thinking' | 'responding' | 'offline';

type Props = {
  mode?: CompanionMode;
  size?: number;
  theme?: 'light' | 'dark';
};

const linear = (duration: number) => (v: Animated.Value) =>
  Animated.timing(v, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true });

const BLINK_MS = 105;
const blink = (v: Animated.Value) => {
  const close = () =>
    Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: BLINK_MS, useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration: BLINK_MS, useNativeDriver: true }),
    ]);
  // Closed at 29.3%, 63.1% and 99.3% of a 15 s cycle.
  return Animated.sequence([
    Animated.delay(4290),
    close(),
    Animated.delay(4860),
    close(),
    Animated.delay(5220),
    close(),
  ]);
};

const LVL_IN = [0, 0.08, 0.16, 0.26, 0.36, 0.46, 0.56, 0.64, 0.74, 1];
const LVL_OUT = [0.25, 0.7, 0.45, 1, 0.5, 0.85, 0.35, 0.75, 0.18, 0.18];
const SWELL_OUT = [1, 1.025, 1.012, 1.04, 1.018, 1.034, 1.01, 1.028, 1, 1];

function LevelBar({ height, width, delay }: { height: number; width: number; delay: number }) {
  const v = useLoop(linear(3200), useMotion(), delay);
  const scaleY = v.interpolate({ inputRange: LVL_IN, outputRange: LVL_OUT });
  return (
    <Animated.View
      style={{ width, height, borderRadius: width / 2, backgroundColor: palette.ink.DEFAULT, transform: [{ scaleY }] }}
    />
  );
}

function Blob({ size, left, top, color, delay, duration }: {
  size: number; left: number; top: number; color: string; delay: number; duration: number;
}) {
  const v = useLoop(linear(duration), useMotion(), delay);
  const s = size;
  const translateX = v.interpolate({ inputRange: [0, 0.33, 0.66, 1], outputRange: [0, s * 0.14, -s * 0.1, 0] });
  const translateY = v.interpolate({ inputRange: [0, 0.33, 0.66, 1], outputRange: [0, -s * 0.1, s * 0.08, 0] });
  const scale = v.interpolate({ inputRange: [0, 0.33, 0.66, 1], outputRange: [1, 1.15, 0.9, 1] });
  return (
    <Animated.View
      style={{
        position: 'absolute', left, top, width: s, height: s, borderRadius: s / 2,
        backgroundImage: `radial-gradient(circle, ${color} 0%, rgba(255,255,255,0) 70%)`,
        transform: [{ translateX }, { translateY }, { scale }],
      }}
    />
  );
}

export function Companion({ mode = 'idle', size = 56, theme = 'light' }: Props) {
  const motion = useMotion();
  const s = size;
  const large = s >= 52;
  const dark = theme === 'dark';

  const breathe = useLoop((v) => pingPong(v, 4000), motion);
  const blinkV = useLoop(blink, motion);
  const swell = useLoop(linear(3200), motion && mode === 'listening');
  const scan = useLoop((v) => pingPong(v, 3000), motion && mode === 'thinking');
  const nod = useLoop(linear(6000), motion && mode === 'responding');

  // Loops that are off rest at 0, which interpolates to no change.
  const NOD_IN = [0, 0.033, 0.054, 0.075, 1];
  const body = [
    { scaleY: breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] }) },
    { scale: swell.interpolate({ inputRange: LVL_IN, outputRange: SWELL_OUT }) },
    { rotate: scan.interpolate({ inputRange: [0, 1], outputRange: ['0deg', mode === 'thinking' ? '3deg' : '0deg'] }) },
    { translateY: nod.interpolate({ inputRange: NOD_IN, outputRange: [0, 0, s * 0.019, 0, 0] }) },
    { rotate: nod.interpolate({ inputRange: NOD_IN, outputRange: ['0deg', '0deg', '1.5deg', '0deg', '0deg'] }) },
  ];

  const eyeW = Math.max(2, s * 0.085);
  const eyeH = Math.max(4, s * (mode === 'listening' ? 0.19 : 0.17));
  const eyeX =
    mode === 'thinking'
      ? scan.interpolate({ inputRange: [0, 1], outputRange: [-s * 0.05, s * 0.05] })
      : 0;
  const eyeScale = blinkV.interpolate({ inputRange: [0, 1], outputRange: [1, 0.08] });
  const eyeColor = dark ? palette.navy.night : palette.ink.DEFAULT;

  const sphere = dark
    ? 'radial-gradient(circle at 36% 30%, #FFFFFF 0%, #DDE3FF 30%, #9AA8F2 64%, #6C7BD8 100%)'
    : 'radial-gradient(circle at 36% 30%, #FFFFFF 0%, #E6E9FA 28%, #B5C0F0 62%, #8796E0 100%)';
  const drop = dark
    ? `0 0 ${s * 0.3}px rgba(124,139,224,0.45)`
    : large
      ? `0 ${s * 0.14}px ${s * 0.3}px rgba(64,82,166,0.28)`
      : `0 ${Math.max(2, s * 0.08)}px ${Math.max(4, s * 0.2)}px rgba(64,82,166,0.25)`;

  const badge = Math.max(12, s * 0.32);

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`MIRA, ${mode}`}
      style={{ width: s, height: large ? s * 1.2 : s }}
    >
      {large ? (
        <View
          style={{
            position: 'absolute', left: s * 0.2, top: s * 1.06, width: s * 0.6, height: s * 0.1, borderRadius: s,
            backgroundImage: `radial-gradient(ellipse, ${dark ? 'rgba(0,0,0,0.45)' : 'rgba(40,52,100,0.22)'} 0%, rgba(40,52,100,0) 70%)`,
          }}
        />
      ) : null}

      <Animated.View style={{ width: s, height: s, transformOrigin: 'bottom', transform: body }}>
        <View style={{ width: s, height: s, borderRadius: s / 2, boxShadow: drop }}>
          <View
            style={{
              width: s, height: s, borderRadius: s / 2, overflow: 'hidden', backgroundImage: sphere,
              boxShadow: `inset 0 ${-s * 0.14}px ${s * 0.24}px rgba(76,92,178,0.34), inset 0 ${s * 0.1}px ${s * 0.2}px rgba(255,255,255,0.6), inset 0 0 0 1px rgba(255,255,255,0.7)`,
            }}
          >
            {large ? (
              <>
                <Blob size={s * 0.72} left={0} top={s * 0.26} color="rgba(110,128,230,0.55)" delay={0} duration={11000} />
                <Blob size={s * 0.56} left={s * 0.42} top={s * 0.38} color="rgba(104,207,193,0.55)" delay={4000} duration={13000} />
                <Blob size={s * 0.5} left={s * 0.28} top={s * 0.58} color="rgba(255,170,206,0.5)" delay={7000} duration={9000} />
              </>
            ) : null}
            <View
              style={{
                position: 'absolute', left: s * 0.18, top: s * 0.1, width: s * 0.4, height: s * 0.2, borderRadius: s,
                transform: [{ rotate: '-26deg' }],
                backgroundImage: 'radial-gradient(ellipse, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 72%)',
              }}
            />
            <View
              style={{
                position: 'absolute', left: 0, top: 0, width: s, height: s,
                backgroundImage: 'radial-gradient(circle at 50% 118%, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0) 42%)',
              }}
            />
          </View>

          <Animated.View
            style={{
              position: 'absolute', top: s * 0.38, left: 0, right: 0, flexDirection: 'row',
              justifyContent: 'center', gap: s * 0.15, transform: [{ translateX: eyeX }],
            }}
          >
            {[0, 1].map((i) => (
              <Animated.View
                key={i}
                style={{
                  width: eyeW, height: eyeH, borderRadius: eyeW / 2, backgroundColor: eyeColor,
                  transform: [{ scaleY: eyeScale }],
                }}
              />
            ))}
          </Animated.View>

          {mode === 'listening' && s >= 40 ? (
            <View
              style={{
                position: 'absolute', top: s * 0.64, left: 0, right: 0, height: s * 0.12,
                flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: s * 0.025,
              }}
            >
              {[0, 400, 150, 550, 250].map((delay, i) => (
                <LevelBar key={i} width={Math.max(2, s * 0.03)} height={s * 0.12} delay={delay} />
              ))}
            </View>
          ) : null}

          {mode === 'offline' ? (
            <View
              style={{
                position: 'absolute', right: -s * 0.04, top: s * 0.66, width: badge, height: badge, borderRadius: badge / 2,
                alignItems: 'center', justifyContent: 'center', borderWidth: Math.max(1.5, s * 0.02),
                borderColor: dark ? palette.ink.DEFAULT : palette.white,
                backgroundColor: dark ? palette.white : palette.ink.DEFAULT,
              }}
            >
              <Svg width={badge * 0.56} height={badge * 0.56} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"
                  stroke={dark ? palette.mint.ink : palette.mint.DEFAULT}
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
          ) : null}
        </View>
      </Animated.View>
    </View>
  );
}
