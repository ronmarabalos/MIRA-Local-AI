/**
 * The design's CSS animations (mira-float, mira-spin, mira-dot, mira-in,
 * mira-pop, mira-up) on React Native's Animated API with the native driver.
 * Every loop stops under reduced motion (system setting or Settings switch).
 */
import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, type StyleProp, type ViewStyle } from 'react-native';
import { cssInterop } from 'nativewind';

import { usePrefs } from '../theme/prefs';

cssInterop(Animated.View, { className: 'style' });

const ease = Easing.inOut(Easing.ease);

export function useMotion(): boolean {
  return !usePrefs().reduceMotion;
}

/** A value driven by a looping animation, started after `delay` ms. */
export function useLoop(
  build: (value: Animated.Value) => Animated.CompositeAnimation,
  enabled: boolean,
  delay = 0,
): Animated.Value {
  const value = useRef(new Animated.Value(0)).current;
  const buildRef = useRef(build);
  buildRef.current = build;
  useEffect(() => {
    value.setValue(0);
    if (!enabled) {
      return;
    }
    const loop = Animated.loop(buildRef.current(value));
    const timer = setTimeout(() => loop.start(), delay);
    return () => {
      clearTimeout(timer);
      loop.stop();
    };
  }, [enabled, delay, value]);
  return value;
}

/** Runs once on mount: 0 to 1. */
export function useEntrance(duration: number, easing = Easing.out(Easing.ease)) {
  const value = useRef(new Animated.Value(0)).current;
  const motion = useMotion();
  useEffect(() => {
    if (!motion) {
      value.setValue(1);
      return;
    }
    Animated.timing(value, { toValue: 1, duration, easing, useNativeDriver: true }).start();
  }, [value, duration, easing, motion]);
  return value;
}

export const pingPong = (value: Animated.Value, duration: number) =>
  Animated.sequence([
    Animated.timing(value, { toValue: 1, duration: duration / 2, easing: ease, useNativeDriver: true }),
    Animated.timing(value, { toValue: 0, duration: duration / 2, easing: ease, useNativeDriver: true }),
  ]);

type BoxProps = {
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

/** mira-float: drifts up and back, 5 s. */
export function Float({
  delay = 0,
  distance = 7,
  className,
  style,
  children,
}: BoxProps & { delay?: number; distance?: number }) {
  const v = useLoop((x) => pingPong(x, 5000), useMotion(), delay);
  const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [0, -distance] });
  return (
    <Animated.View className={className} style={[style, { transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}

/** mira-spin: one turn every `duration` ms. */
export function Spin({ duration = 2400, className, style, children }: BoxProps & { duration?: number }) {
  const v = useLoop(
    (x) => Animated.timing(x, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true }),
    useMotion(),
  );
  const rotate = v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <Animated.View className={className} style={[style, { transform: [{ rotate }] }]}>
      {children}
    </Animated.View>
  );
}

/** mira-dot: fades and grows in turn. */
export function PulseDot({
  delay = 0,
  duration = 1200,
  scale = false,
  className,
  style,
}: BoxProps & { delay?: number; duration?: number; scale?: boolean }) {
  const motion = useMotion();
  const v = useLoop(
    (x) =>
      Animated.sequence([
        Animated.timing(x, { toValue: 1, duration: duration * 0.4, easing: ease, useNativeDriver: true }),
        Animated.timing(x, { toValue: 0, duration: duration * 0.4, easing: ease, useNativeDriver: true }),
        Animated.delay(duration * 0.2),
      ]),
    motion,
    delay,
  );
  const opacity = motion ? v.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] }) : 1;
  const transform = scale ? [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }] : [];
  return <Animated.View className={className} style={[style, { opacity, transform }]} />;
}

/** mira-in: fades in from slightly below (or slightly small). */
export function FadeIn({
  from = 'below',
  distance = 8,
  className,
  style,
  children,
}: BoxProps & { from?: 'below' | 'scale'; distance?: number }) {
  const v = useEntrance(from === 'scale' ? 250 : 350);
  const transform =
    from === 'scale'
      ? [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }]
      : [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }];
  return (
    <Animated.View className={className} style={[style, { opacity: v, transform }]}>
      {children}
    </Animated.View>
  );
}

/** mira-pop: springs in for a success mark. */
export function Pop({ className, style, children }: BoxProps) {
  const v = useEntrance(450);
  const scale = v.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.6, 1.08, 1] });
  const opacity = v.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0, 1, 1] });
  return (
    <Animated.View className={className} style={[style, { opacity, transform: [{ scale }] }]}>
      {children}
    </Animated.View>
  );
}

/** mira-up: a sheet rising into place. */
export function SlideUp({ className, style, children }: BoxProps) {
  const v = useEntrance(300);
  const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });
  return (
    <Animated.View className={className} style={[style, { opacity: v, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}
