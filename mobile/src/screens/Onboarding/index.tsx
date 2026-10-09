/** Board 02-onboarding: three slides, then setup. */
import { useEffect, useRef, useState } from 'react';
import { Animated, View } from 'react-native';

import { Companion } from '../../components/Companion';
import { Icon, type IconName } from '../../components/Icon';
import { Float, useMotion } from '../../components/motion';
import { useGo } from '../../components/nav';
import { Screen } from '../../components/Screen';
import { T } from '../../components/T';
import { Glass, IconTile, Tap } from '../../components/ui';
import { fx } from '../../theme/effects';
import palette from '../../theme/palette';

const SLIDES = [
  {
    headline: 'Meet your personal AI.',
    body: 'An intelligent assistant that learns how you work and helps you stay one step ahead.',
  },
  {
    headline: 'An AI that learns from you.',
    body: 'Show MIRA your preferences, routines, and instructions. It remembers what you approve.',
  },
  {
    headline: 'Private by design. Useful offline.',
    body: 'Keep personal memory on your device and decide what MIRA can access or do.',
  },
];

function FloatCard({ icon, fg, bg, title, sub, delay, pos }: {
  icon: IconName; fg: string; bg: string; title: string; sub: string; delay: number;
  pos: { left?: number; right?: number; top?: number; bottom?: number };
}) {
  return (
    <Float delay={delay} style={{ position: 'absolute', ...pos }}>
      <View className="flex-row items-center gap-10 rounded-16 border border-white/78 bg-white/46 px-12 py-10" style={fx.float}>
        <IconTile name={icon} size={32} radius={10} iconSize={18} fg={fg} bg={bg} />
        <View className="gap-2">
          <T className="text-12 font-bold">{title}</T>
          <T className="text-11 text-ink-muted">{sub}</T>
        </View>
      </View>
    </Float>
  );
}

function FloatPill({ children, delay, pos }: {
  children: React.ReactNode; delay: number; pos: { left?: number; right?: number; top?: number; bottom?: number };
}) {
  return (
    <Float delay={delay} style={{ position: 'absolute', ...pos }}>
      <View className="flex-row items-center gap-6 rounded-full border border-white/78 bg-white/46 px-12 py-8" style={fx.floatPill}>
        {children}
      </View>
    </Float>
  );
}

function SlideMeet() {
  return (
    <View className="h-360 w-full max-w-342 items-center justify-center">
      <View className="absolute h-300 w-300 rounded-full border border-dashed border-peri-200" />
      <Companion size={132} />
      <FloatCard
        icon="check" fg={palette.navy.DEFAULT} bg={palette.peri.tonal} title="Submit report" sub="Today · 5:00 PM"
        delay={0} pos={{ left: 0, top: 34 }}
      />
      <FloatCard
        icon="mail" fg={palette.mint.ink} bg={palette.mint.bg} title="Maya Chen" sub="Can we reschedule?"
        delay={1500} pos={{ right: 0, top: 120 }}
      />
      <FloatCard
        icon="calendar" fg={palette.warning.ink} bg={palette.warning.bg} title="Design review" sub="Tomorrow · 10:00 AM"
        delay={3000} pos={{ left: 24, bottom: 22 }}
      />
    </View>
  );
}

function SlideLearn() {
  const tag = (text: string) => (
    <View key={text} className="rounded-10 bg-white/55 px-10 py-6">
      <T className="text-12 font-semibold">{text}</T>
    </View>
  );
  return (
    <View className="w-full max-w-342 items-center gap-14">
      <View className="max-w-250 self-end rounded-t-20 rounded-bl-20 rounded-br-6 bg-ink px-16 py-14">
        <T className="text-14 leading-[20.3px] text-white">“Keep my email replies short and friendly.”</T>
      </View>
      <View className="flex-row items-center gap-10">
        <Companion size={44} mode="responding" />
        <T className="text-12 font-semibold text-navy">MIRA turns it into…</T>
      </View>
      <Glass className="w-full gap-10 rounded-20 p-16" style={fx.card06}>
        <View className="flex-row items-center justify-between">
          <T className="text-11 font-bold tracking-[0.88px] text-navy">PREFERENCE</T>
          <View className="rounded-full bg-success-bg px-8 py-4">
            <T className="text-11 font-semibold text-success-ink">Saved</T>
          </View>
        </View>
        <View className="flex-row flex-wrap gap-8">
          {['Tone · Friendly', 'Length · Short', 'Applies to · Email drafts'].map(tag)}
        </View>
      </Glass>
      <Glass className="w-full flex-row items-center gap-12 rounded-20 p-16" style={fx.card06}>
        <IconTile name="bolt" size={40} radius={12} fg={palette.mint.ink} bg={palette.mint.bg} />
        <View className="flex-1 gap-2">
          <T className="text-11 font-bold tracking-[0.88px] text-mint-ink">ROUTINE</T>
          <T className="text-14 font-semibold">Sundays 7 PM · Plan my week</T>
        </View>
      </Glass>
    </View>
  );
}

function SlidePrivate() {
  return (
    <View className="h-340 w-full max-w-342 items-center justify-center">
      <View className="absolute h-300 w-190 rounded-36 border-2 border-peri-200 bg-white/60" style={fx.phone} />
      <Companion size={112} mode="offline" />
      <View className="absolute h-56 w-56 items-center justify-center rounded-18 bg-ink" style={[fx.badge, { left: 196, top: 170 }]}>
        <Icon name="shieldCheck" size={26} color={palette.white} />
      </View>
      <FloatPill delay={0} pos={{ left: 6, top: 60 }}>
        <View className="h-8 w-8 rounded-full bg-success" />
        <T className="text-12 font-semibold">On-device memory</T>
      </FloatPill>
      <FloatPill delay={1400} pos={{ right: 0, top: 34 }}>
        <Icon name="wifiOff" size={14} strokeWidth={2.2} color={palette.navy.DEFAULT} />
        <T className="text-12 font-semibold">Works offline</T>
      </FloatPill>
      <FloatPill delay={2600} pos={{ left: 20, bottom: 30 }}>
        <Icon name="lock" size={14} strokeWidth={2.2} color={palette.warning.ink} />
        <T className="text-12 font-semibold">You approve every action</T>
      </FloatPill>
    </View>
  );
}

function PageDot({ active }: { active: boolean }) {
  const motion = useMotion();
  const width = useRef(new Animated.Value(active ? 28 : 8)).current;
  useEffect(() => {
    Animated.timing(width, { toValue: active ? 28 : 8, duration: motion ? 300 : 0, useNativeDriver: false }).start();
  }, [active, motion, width]);
  return <Animated.View className={`h-8 rounded-full ${active ? 'bg-navy' : 'bg-peri-200'}`} style={{ width }} />;
}

export default function OnboardingScreen() {
  const go = useGo();
  const [step, setStep] = useState(0);
  const slide = SLIDES[step];

  return (
    <Screen top={56} px={24} gap={0} bottom={40} fill>
      <View className="h-44 flex-row items-center justify-between">
        {step > 0 ? (
          <Tap
            label="Back"
            onPress={() => setStep(step - 1)}
            className="h-44 w-44 items-center justify-center rounded-14 border border-white/80 bg-white/60"
          >
            <Icon name="back" size={20} />
          </Tap>
        ) : (
          <View className="h-44 w-44" />
        )}
        <Tap label="Skip" onPress={() => go('Setup')} className="h-44 justify-center px-12">
          <T className="text-15 font-semibold text-ink-2">Skip</T>
        </Tap>
      </View>

      <View className="mt-8 h-380 items-center justify-center">
        {step === 0 ? <SlideMeet /> : step === 1 ? <SlideLearn /> : <SlidePrivate />}
      </View>

      <View className="mt-24 gap-12">
        <T accessibilityRole="header" className="text-32 font-bold leading-[36.8px] tracking-[-0.64px]">
          {slide.headline}
        </T>
        <T className="text-16 leading-[24.8px] text-ink-2">{slide.body}</T>
      </View>

      <View className="mt-auto flex-row items-center justify-between gap-16 pt-24">
        <View accessibilityLabel={`Page ${step + 1} of 3`} className="flex-row gap-6">
          {[0, 1, 2].map((i) => (
            <PageDot key={i} active={i === step} />
          ))}
        </View>
        <Tap
          label={step < 2 ? 'Next' : 'Get started'}
          onPress={() => (step < 2 ? setStep(step + 1) : go('Setup'))}
          className="h-56 flex-row items-center gap-8 rounded-18 px-28"
          style={[fx.primary, fx.liftLgStrong]}
        >
          <T className="text-16 font-bold text-white">{step < 2 ? 'Next' : 'Get started'}</T>
          {step < 2 ? <Icon name="arrowRight" size={18} strokeWidth={2.2} color={palette.white} /> : null}
        </Tap>
      </View>
    </Screen>
  );
}
