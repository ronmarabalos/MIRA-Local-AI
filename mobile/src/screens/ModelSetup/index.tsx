/** Board 04-ai-model-setup. Shows whether the model file is on this phone; nothing is downloaded. */
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import { Companion } from '../../components/Companion';
import { Icon } from '../../components/Icon';
import { Spin } from '../../components/motion';
import { useGo } from '../../components/nav';
import { Screen } from '../../components/Screen';
import { Steps } from '../../components/Steps';
import { T } from '../../components/T';
import { BackButton, Glass, PrimaryButton, Rows, SecondaryButton } from '../../components/ui';
import { isModelOnPhone } from '../../services/firstRun';
import { fx } from '../../theme/effects';
import palette from '../../theme/palette';

type Phase = 'idle' | 'ready';

const STATUS: Record<Phase, { label: string; fg: string; bg: string }> = {
  idle: { label: 'Not on this phone yet', fg: palette.ink.label, bg: 'rgba(255,255,255,0.6)' },
  ready: { label: 'On this phone · ready offline', fg: palette.success.ink, bg: palette.success.bg },
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

  // MIRA cannot download anything: the file is copied to the phone over USB.
  const check = useCallback(() => {
    isModelOnPhone().then(
      present => setPhase(present ? 'ready' : 'idle'),
      () => setPhase('idle'),
    );
  }, []);
  useEffect(check, [check]);

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
          <Companion size={84} mode={phase === 'ready' ? 'offline' : 'idle'} />
          <View className="absolute bottom-6 right-2 h-30 w-30 items-center justify-center rounded-10 border-[3px] border-white bg-ink">
            <Icon name="phoneBare" size={14} strokeWidth={2.4} color={palette.white} />
          </View>
        </View>
        <View className="items-center gap-6">
          <T accessibilityRole="header" className="text-center text-24 font-bold leading-[30px] tracking-[-0.48px]">
            MIRA runs on this phone
          </T>
          <T className="max-w-290 text-center text-14 leading-[21px] text-ink-2">Your messages are read here, never on a server. It works with no connection.</T>
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
          <Fact label="Where it runs">
            <T className="text-14 font-bold">On this phone</T>
          </Fact>
          <Fact label="Size on this phone">
            <T className="text-14 font-bold">About 1.1 GB</T>
          </Fact>
          <Fact label="Internet needed">
            <View className="flex-row items-center gap-6">
              <Icon name="check" size={16} strokeWidth={2.4} color={palette.success.ink} />
              <T className="text-14 font-bold text-success-ink">Never</T>
            </View>
          </Fact>
        </Rows>
      </Glass>

      <View className="flex-row items-start gap-10 rounded-16 bg-warning-bg px-14 py-12">
        <View className="mt-1">
          <Icon name="info" size={18} color={palette.warning.text} />
        </View>
        <T className="flex-1 text-13 leading-[18.85px] text-warning-text">
          {phase === 'ready'
            ? 'Nothing was downloaded. The file was copied to this phone over USB.'
            : 'MIRA never downloads anything. Copy the file to this phone over USB, then check again.'}
        </T>
      </View>

      <View className="mt-auto gap-10">
        {phase === 'idle' ? (
          <PrimaryButton label="Check again" onPress={check} />
        ) : (
          <PrimaryButton label="Finish setup" onPress={finish} />
        )}
        {phase === 'idle' ? <SecondaryButton label="Continue for now" onPress={finish} /> : null}
      </View>
    </Screen>
  );
}
