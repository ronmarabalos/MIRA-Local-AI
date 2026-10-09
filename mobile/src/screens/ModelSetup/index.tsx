/** Board 04-ai-model-setup. The download is simulated, as on the board. */
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { Companion } from '../../components/Companion';
import { Icon } from '../../components/Icon';
import { Spin } from '../../components/motion';
import { useGo } from '../../components/nav';
import { Screen } from '../../components/Screen';
import { Steps } from '../../components/Steps';
import { T } from '../../components/T';
import { BackButton, Glass, PrimaryButton, Rows, SecondaryButton } from '../../components/ui';
import { fx } from '../../theme/effects';
import palette from '../../theme/palette';

type Phase = 'idle' | 'downloading' | 'ready';

const STATUS: Record<Phase, { label: string; fg: string; bg: string }> = {
  idle: { label: 'Not downloaded', fg: palette.ink.label, bg: 'rgba(255,255,255,0.6)' },
  downloading: { label: 'Downloading · demo', fg: palette.navy.DEFAULT, bg: palette.peri.tonal },
  ready: { label: 'Installed · ready offline', fg: palette.success.ink, bg: palette.success.bg },
};

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="flex-row items-center justify-between py-13">
      <T className="text-14 text-ink-2">{label}</T>
      {children}
    </View>
  );
}

export default function ModelSetupScreen() {
  const go = useGo();
  const [phase, setPhase] = useState<Phase>('idle');
  const [pct, setPct] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = () => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  };
  useEffect(() => stop, []);

  useEffect(() => {
    if (phase === 'downloading' && pct >= 100) {
      stop();
      setPhase('ready');
    }
  }, [phase, pct]);

  const start = () => {
    setPhase('downloading');
    setPct(0);
    timer.current = setInterval(() => setPct((p) => Math.min(100, p + 7)), 180);
  };

  const status = STATUS[phase];
  const finish = () => go('Home', { reset: true });

  return (
    <Screen top={56} px={24} gap={20} bottom={32} fill>
      <View className="gap-10">
        <View className="flex-row items-center justify-between">
          <BackButton to="Setup" look="plain" />
          <T className="text-13 font-semibold text-ink-2">Step 2 of 3</T>
        </View>
        <Steps done={2} />
      </View>

      <Glass className="items-center gap-16 rounded-28 px-20 pb-20 pt-24" style={fx.panel06}>
        <View className="h-112 w-112 items-center justify-center">
          <Spin className="absolute inset-0">
            <View
              className="h-112 w-112 rounded-full border-2 border-dashed"
              style={{ borderColor: phase === 'ready' ? palette.success.DEFAULT : palette.peri[300] }}
            />
          </Spin>
          <Companion size={84} mode={phase === 'downloading' ? 'thinking' : phase === 'ready' ? 'offline' : 'idle'} />
          <View className="absolute bottom-6 right-2 h-30 w-30 items-center justify-center rounded-10 border-[3px] border-white bg-ink">
            <Icon name="phoneBare" size={14} strokeWidth={2.4} color={palette.white} />
          </View>
        </View>
        <View className="items-center gap-6">
          <T accessibilityRole="header" className="text-center text-24 font-bold leading-[30px] tracking-[-0.48px]">
            Your AI runs on this device
          </T>
          <T className="max-w-290 text-center text-14 leading-[21px] text-ink-2">Private, and works offline.</T>
        </View>
        <View className="flex-row items-center gap-6 rounded-full px-12 py-6" style={{ backgroundColor: status.bg }}>
          <View className="h-8 w-8 rounded-full" style={{ backgroundColor: status.fg }} />
          <T className="text-12 font-bold" style={{ color: status.fg }}>
            {status.label}
          </T>
        </View>
      </Glass>

      <Glass className="rounded-22 px-16 py-4">
        <Rows>
          <Fact label="Model">
            <T className="text-14 font-bold">MIRA Core · compact</T>
          </Fact>
          <Fact label="Download size">
            <T className="text-14 font-bold">1.8 GB</T>
          </Fact>
          <Fact label="Free space">
            <T className="text-14 font-bold">23.4 GB available</T>
          </Fact>
          <Fact label="This device">
            <View className="flex-row items-center gap-6">
              <Icon name="check" size={16} strokeWidth={2.4} color={palette.success.ink} />
              <T className="text-14 font-bold text-success-ink">Compatible</T>
            </View>
          </Fact>
        </Rows>
      </Glass>

      <View className="flex-row items-start gap-10 rounded-16 bg-warning-bg px-14 py-12">
        <View className="mt-1">
          <Icon name="info" size={18} color={palette.warning.text} />
        </View>
        <T className="text-13 leading-[18.85px] text-warning-text">Wi-Fi recommended</T>
      </View>

      <View className="mt-auto gap-10">
        {phase === 'idle' ? (
          <PrimaryButton
            label="Download model · 1.8 GB"
            onPress={start}
            left={<Icon name="download" size={18} strokeWidth={2.2} color={palette.white} />}
          />
        ) : phase === 'downloading' ? (
          <Glass
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: 100, now: pct }}
            className="h-56 justify-center gap-8 rounded-18 px-16"
          >
            <View className="flex-row justify-between">
              <T className="text-13 font-bold">Downloading…</T>
              <T className="text-13 font-bold text-navy">{pct}%</T>
            </View>
            <View className="h-6 overflow-hidden rounded-full bg-peri-tonal">
              <View className="h-6 rounded-full" style={[fx.progress, { width: `${pct}%` }]} />
            </View>
          </Glass>
        ) : (
          <PrimaryButton label="Finish setup" onPress={finish} />
        )}
        <SecondaryButton
          label="Continue with demo"
          onPress={finish}
          right={
            <View className="rounded-full bg-warning-bg px-8 py-3">
              <T className="text-11 font-bold text-warning-ink">Simulated AI</T>
            </View>
          }
        />
      </View>
    </Screen>
  );
}
