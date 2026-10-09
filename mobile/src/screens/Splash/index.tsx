/** Board 01-splash. */
import { useEffect } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Companion } from '../../components/Companion';
import { PulseDot } from '../../components/motion';
import { useGo } from '../../components/nav';
import { useStatusBar } from '../../components/Screen';
import { SilkBackground } from '../../components/SilkBackground';
import { T } from '../../components/T';
import { Tap } from '../../components/ui';
import { bridge } from '../../services';
import { getStore } from '../../services/db';
import { isSetUp } from '../../services/firstRun';
import { fx } from '../../theme/effects';

export default function SplashScreen() {
  const go = useGo();
  const insets = useSafeAreaInsets();
  useStatusBar(false);

  useEffect(() => {
    let live = true;
    // Someone who has already set MIRA up goes straight to their day.
    const next = getStore()
      .then(store => isSetUp(bridge, store))
      .catch(() => false);
    const timer = setTimeout(async () => {
      const ready = await next;
      if (live) {
        go(ready ? 'Home' : 'Onboarding', ready ? { reset: true } : { replace: true });
      }
    }, 2600);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [go]);

  return (
    <View className="flex-1 bg-silk-base">
      <SilkBackground />
      <View pointerEvents="none" className="absolute h-520 w-520 rounded-full" style={[fx.glowSplash, { left: -65, top: 120 }]} />
      <Tap
        label="Continue to onboarding"
        activeOpacity={1}
        onPress={() => go('Onboarding', { replace: true })}
        className="absolute inset-0 items-center justify-center gap-28"
      >
        <Companion size={160} />
        <View className="items-center gap-10">
          <T className="pl-[9.7px] text-44 font-bold tracking-[9.7px]">MIRA</T>
          <T className="max-w-260 text-center text-15 font-medium leading-[22.5px] text-ink-2">
            Your Messages. Your Rules.{'\n'}Your Personal Assistant.
          </T>
        </View>
      </Tap>
      <View pointerEvents="none" className="absolute left-0 right-0 items-center gap-14" style={{ bottom: 64 + insets.bottom / 2 }}>
        <View className="flex-row gap-8">
          {[0, 200, 400].map((delay) => (
            <PulseDot key={delay} delay={delay} duration={1400} scale className="h-8 w-8 rounded-full bg-peri-600" />
          ))}
        </View>
        <T className="text-13 font-medium text-ink-2">Waking up your on-device assistant</T>
      </View>
    </View>
  );
}
