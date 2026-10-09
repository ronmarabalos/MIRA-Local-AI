/**
 * The soft silver silk behind every screen (the `aria-hidden` layer on each
 * board): a vertical gradient, a shadow fold top left, two light streaks, and
 * a pastel sheen on the right. The boards blur these shapes; React Native
 * blurs only on Android, so each shape is also a soft gradient on its own.
 */
import { View, type ViewStyle } from 'react-native';

import { silk } from '../theme/effects';

const blob = (style: ViewStyle): ViewStyle => ({ position: 'absolute', borderRadius: 9999, ...style });

export function SilkBackground({ dark = false }: { dark?: boolean }) {
  return (
    <View pointerEvents="none" className="absolute inset-0 overflow-hidden" style={dark ? silk.dark : silk.light}>
      <View
        style={blob({
          width: 560, height: 360, left: -150, top: -90, transform: [{ rotate: '-16deg' }],
          filter: 'blur(28px)',
          backgroundImage: dark
            ? 'radial-gradient(ellipse at 55% 60%, rgba(130,146,220,0.35) 0%, rgba(92,106,150,0) 66%)'
            : 'radial-gradient(ellipse at 55% 60%, rgba(92,106,150,0.55) 0%, rgba(92,106,150,0) 66%)',
        })}
      />
      <View
        style={blob({
          width: 260, height: 640, right: -40, top: -180, transform: [{ rotate: '28deg' }],
          filter: 'blur(16px)',
          backgroundImage: `radial-gradient(ellipse, rgba(255,255,255,${dark ? 0.12 : 0.9}) 0%, rgba(255,255,255,0) 62%)`,
        })}
      />
      <View
        style={blob({
          width: 180, height: 520, left: 120, top: -160, transform: [{ rotate: '-30deg' }],
          filter: 'blur(22px)',
          backgroundImage: `radial-gradient(ellipse, rgba(255,255,255,${dark ? 0.08 : 0.55}) 0%, rgba(255,255,255,0) 62%)`,
        })}
      />
      <View
        style={blob({
          width: 420, height: 260, right: -160, top: 260,
          filter: 'blur(46px)',
          backgroundImage:
            'radial-gradient(circle at 30% 40%, rgba(255,190,214,0.35) 0%, rgba(255,190,214,0) 55%), ' +
            'radial-gradient(circle at 68% 34%, rgba(196,206,255,0.35) 0%, rgba(196,206,255,0) 55%), ' +
            'radial-gradient(circle at 62% 72%, rgba(176,236,226,0.32) 0%, rgba(176,236,226,0) 55%), ' +
            'radial-gradient(circle at 34% 74%, rgba(255,226,196,0.3) 0%, rgba(255,226,196,0) 55%)',
        })}
      />
    </View>
  );
}
