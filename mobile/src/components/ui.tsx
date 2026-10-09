/**
 * Small building blocks shared by the screens, each matching a recurring
 * element on the boards (board 00-foundations names most of them).
 */
import { useEffect, useRef, type ReactNode } from 'react';
import {
  Animated,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
  type StyleProp,
  type TextInputProps,
  type TouchableOpacityProps,
  type ViewProps,
  type ViewStyle,
} from 'react-native';

import { fx } from '../theme/effects';
import palette from '../theme/palette';
import { Icon, type IconName } from './Icon';
import { useMotion } from './motion';
import { useBack, type Board } from './nav';
import { T } from './T';

type GlassKind = 'glass' | 'glass2' | 'dark';

const GLASS_CLASS: Record<GlassKind, string> = {
  glass: 'border border-white/80 bg-white/46',
  glass2: 'border border-white/78 bg-white/46',
  dark: 'border border-white/14 bg-white/7',
};
const GLASS_FX: Record<GlassKind, ViewStyle> = { glass: fx.glass, glass2: fx.glass2, dark: fx.glassDark };

/** A frosted glass surface. */
export function Glass({
  kind = 'glass2',
  className = '',
  style,
  ...props
}: ViewProps & { kind?: GlassKind }) {
  return <View {...props} className={`${GLASS_CLASS[kind]} ${className}`} style={[GLASS_FX[kind], style]} />;
}

/** Anything tappable. `glass` gives it the glass surface. */
export function Tap({
  label,
  glass,
  className = '',
  style,
  ...props
}: TouchableOpacityProps & { label?: string; glass?: GlassKind }) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={label}
      {...props}
      className={`${glass ? GLASS_CLASS[glass] : ''} ${className}`}
      style={[glass ? GLASS_FX[glass] : null, style]}
    />
  );
}

type ButtonProps = {
  label: string;
  onPress?(): void;
  height?: number;
  radius?: number;
  textClassName?: string;
  className?: string;
  style?: StyleProp<ViewStyle>;
  left?: ReactNode;
  right?: ReactNode;
  disabled?: boolean;
};

/** Deep navy gradient button with white text. */
export function PrimaryButton({
  label,
  onPress,
  height = 56,
  radius = 18,
  textClassName = 'text-16',
  className = '',
  style = fx.liftLg,
  left,
  right,
  disabled,
}: ButtonProps) {
  return (
    <Tap
      label={label}
      onPress={onPress}
      disabled={disabled}
      className={`flex-row items-center justify-center gap-8 ${className}`}
      style={[fx.primary, { height, borderRadius: radius }, style]}
    >
      {left}
      <T className={`font-bold text-white ${textClassName}`}>{label}</T>
      {right}
    </Tap>
  );
}

/** Light glass-edged button. */
export function SecondaryButton({
  label,
  onPress,
  height = 52,
  radius = 18,
  textClassName = 'text-15',
  className = '',
  style,
  left,
  right,
}: ButtonProps) {
  return (
    <Tap
      label={label}
      onPress={onPress}
      className={`flex-row items-center justify-center gap-8 border border-white/80 bg-white/60 ${className}`}
      style={[{ height, borderRadius: radius }, style]}
    >
      {left}
      <T className={`font-bold ${textClassName}`}>{label}</T>
      {right}
    </Tap>
  );
}

/** The 44-point back button at the top of most boards. */
export function BackButton({
  to,
  label = 'Back',
  look = 'glass',
}: {
  to: Board;
  label?: string;
  look?: 'glass' | 'plain' | 'round';
}) {
  const back = useBack(to);
  const shape =
    look === 'round'
      ? 'rounded-full'
      : look === 'plain'
        ? 'rounded-14 border border-white/80 bg-white/60'
        : 'rounded-14';
  return (
    <Tap
      label={label}
      onPress={back}
      glass={look === 'plain' ? undefined : look === 'round' ? 'glass' : 'glass2'}
      className={`h-44 w-44 items-center justify-center ${shape}`}
    >
      <Icon name="back" size={20} />
    </Tap>
  );
}

/** The 52 x 32 switch track. Pass `onPress` when the switch itself is the control. */
export function Switch({ on, onPress, label }: { on: boolean; onPress?(): void; label?: string }) {
  const motion = useMotion();
  const x = useRef(new Animated.Value(on ? 1 : 0)).current;
  useEffect(() => {
    if (motion) {
      Animated.timing(x, { toValue: on ? 1 : 0, duration: 200, useNativeDriver: true }).start();
    } else {
      x.setValue(on ? 1 : 0);
    }
  }, [on, motion, x]);
  const track = (
    <View className={`h-32 w-52 shrink-0 rounded-full p-3 ${on ? 'bg-navy' : 'bg-peri-track'}`}>
      <Animated.View
        className="h-26 w-26 rounded-full bg-white"
        style={[fx.knob, { transform: [{ translateX: x.interpolate({ inputRange: [0, 1], outputRange: [0, 20] }) }] }]}
      />
    </View>
  );
  if (!onPress) {
    return track;
  }
  return (
    <Tap
      label={label}
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {track}
    </Tap>
  );
}

/** A small rounded status label. */
export function Chip({
  label,
  fg,
  bg,
  className = 'px-8 py-4',
  textClassName = 'text-11 font-bold',
  dot,
  icon,
  iconD,
}: {
  label: string;
  fg: string;
  bg: string;
  className?: string;
  textClassName?: string;
  dot?: boolean;
  icon?: IconName;
  iconD?: string;
}) {
  return (
    <View className={`flex-row items-center gap-4 self-start rounded-full ${className}`} style={{ backgroundColor: bg }}>
      {dot ? <View className="h-6 w-6 rounded-full" style={{ backgroundColor: fg }} /> : null}
      {icon || iconD ? <Icon name={icon} d={iconD} size={11} strokeWidth={2.8} color={fg} /> : null}
      <T className={textClassName} style={{ color: fg }}>
        {label}
      </T>
    </View>
  );
}

export type PillItem<K extends string> = { id: K; label: string; count?: number };

/** The black-or-white filter pills; scrolls sideways past the screen edge. */
export function FilterPills<K extends string>({
  items,
  value,
  onChange,
  scroll = true,
  label,
}: {
  items: PillItem<K>[];
  value: K;
  onChange(id: K): void;
  scroll?: boolean;
  label: string;
}) {
  const pills = items.map((item) => {
    const sel = item.id === value;
    return (
      <Tap
        key={item.id}
        label={item.label}
        accessibilityRole="tab"
        accessibilityState={{ selected: sel }}
        onPress={() => onChange(item.id)}
        className={`h-38 shrink-0 flex-row items-center gap-6 rounded-full border px-14 ${
          sel ? 'border-ink bg-ink' : 'border-white/80 bg-white'
        }`}
      >
        <T className={`text-13 font-bold ${sel ? 'text-white' : 'text-ink'}`}>{item.label}</T>
        {item.count !== undefined ? (
          <T className={`text-11 font-bold opacity-80 ${sel ? 'text-white' : 'text-ink'}`}>{item.count}</T>
        ) : null}
      </Tap>
    );
  });
  if (!scroll) {
    return (
      <View accessibilityRole="tablist" accessibilityLabel={label} className="flex-row gap-8">
        {pills}
      </View>
    );
  }
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="tablist"
      accessibilityLabel={label}
      className="-mx-20"
      contentContainerClassName="gap-8 px-20 pb-2"
    >
      {pills}
    </ScrollView>
  );
}

/** Choice pills used in builders and sheets (selected: tonal with an indigo edge). */
export function ChoicePill({ label, selected, onPress, className = 'h-38 rounded-12 px-12' }: {
  label: string;
  selected: boolean;
  onPress(): void;
  className?: string;
}) {
  return (
    <Tap
      label={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      className={`items-center justify-center ${className} ${
        selected ? 'border-[1.5px] border-peri-600 bg-peri-tonal' : 'border border-white/80 bg-white'
      }`}
    >
      <T className={`text-13 font-bold ${selected ? 'text-navy-pressed' : 'text-ink'}`}>{label}</T>
    </Tap>
  );
}

/** A text field; pass Tailwind classes for its box and text. */
export function Field({ className = '', ...props }: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={palette.ink.placeholder}
      selectionColor={palette.navy.DEFAULT}
      {...props}
      className={`font-normal text-ink ${className}`}
    />
  );
}

/** The search box with the magnifier inside. */
export function SearchField(props: TextInputProps & { label: string }) {
  return (
    <View className="relative justify-center">
      <View pointerEvents="none" className="absolute left-14 z-10">
        <Icon name="search" size={18} color={palette.ink.muted} />
      </View>
      <Field
        accessibilityLabel={props.label}
        {...props}
        className="h-48 rounded-16 border border-white/80 bg-white/60 pl-42 pr-14 text-14"
      />
    </View>
  );
}

/** Square check box: navy with a tick, or white with a periwinkle edge. */
export function CheckBox({ on, size = 22, radius = 7, round = false, onColor = palette.navy.DEFAULT, border = 2 }: {
  on: boolean;
  size?: number;
  radius?: number;
  round?: boolean;
  onColor?: string;
  border?: number;
}) {
  return (
    <View
      className="items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: round ? size / 2 : radius,
        backgroundColor: on ? onColor : palette.white,
        borderWidth: on ? 0 : border,
        borderColor: palette.peri[300],
      }}
    >
      {on ? <Icon name="check" size={size * 0.62} strokeWidth={3} color={palette.white} /> : null}
    </View>
  );
}

/** Radio dot: a thick navy ring when selected. */
export function Radio({ on }: { on: boolean }) {
  return (
    <View
      className="h-20 w-20 shrink-0 rounded-full"
      style={{ borderWidth: on ? 6 : 2, borderColor: on ? palette.navy.DEFAULT : palette.peri[300] }}
    />
  );
}

/** The uppercase section label above grouped rows. */
export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <T className={`text-12 font-bold tracking-[0.72px] text-ink-label ${className}`}>{children}</T>;
}

/** An icon in a rounded tinted square. */
export function IconTile({
  name,
  d,
  size = 40,
  radius = 12,
  iconSize = 20,
  strokeWidth = 2,
  fg,
  bg,
  className = '',
}: {
  name?: IconName;
  d?: string;
  size?: number;
  radius?: number;
  iconSize?: number;
  strokeWidth?: number;
  fg: string;
  bg: string;
  className?: string;
}) {
  return (
    <View
      className={`shrink-0 items-center justify-center ${className}`}
      style={{ width: size, height: size, borderRadius: radius, backgroundColor: bg }}
    >
      <Icon name={name} d={d} size={iconSize} strokeWidth={strokeWidth} color={fg} />
    </View>
  );
}

/** Rows in a glass group, separated by hairlines. */
export function Rows({ children }: { children: ReactNode[] }) {
  const items = children.filter(Boolean);
  return (
    <>
      {items.map((child, i) => (
        <View key={i} className={i < items.length - 1 ? 'border-b border-ink/8' : ''}>
          {child}
        </View>
      ))}
    </>
  );
}
