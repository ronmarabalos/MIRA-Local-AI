/** P0 B4.2: explain notification access, open Android settings, and recheck on return. */
import { useCallback, useState } from 'react';
import { View } from 'react-native';

import { Companion } from '../../components/Companion';
import { Icon } from '../../components/Icon';
import { useGo } from '../../components/nav';
import { Screen } from '../../components/Screen';
import { T } from '../../components/T';
import { Glass, PrimaryButton, SecondaryButton } from '../../components/ui';
import { bridge } from '../../services';
import { useForegroundRetry } from '../../services/db/foreground';
import palette from '../../theme/palette';

export default function OnboardingScreen() {
  const go = useGo();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');

  const checkAccess = useCallback(async () => {
    setChecking(true);
    setError('');
    try {
      setEnabled(await bridge.isListenerEnabled());
    } catch {
      setError('Could not check notification access. Try again.');
    } finally {
      setChecking(false);
    }
  }, []);
  useForegroundRetry(checkAccess);

  const openSettings = async () => {
    setError('');
    try {
      await bridge.openListenerSettings();
    } catch {
      setError('Could not open notification settings. Try again.');
    }
  };

  const status = checking
    ? 'Checking notification access...'
    : error ||
      (enabled
        ? 'Notification access is on.'
        : 'Notification access is off.');

  return (
    <Screen top={56} px={24} gap={20} bottom={36} fill>
      <View className="items-center gap-14">
        <View className="rounded-full bg-white/60 px-12 py-7">
          <T className="text-12 font-bold tracking-[0.8px] text-navy">PRIVATE SETUP</T>
        </View>
        <Companion size={116} mode={enabled ? 'responding' : 'offline'} />
      </View>

      <View className="gap-10">
        <T accessibilityRole="header" className="text-30 font-bold leading-[36px] tracking-[-0.6px]">
          Allow notification access
        </T>
        <T className="text-16 leading-[24.8px] text-ink-2">
          MIRA uses Android notification access to report what matters from apps you choose.
        </T>
      </View>

      <Glass className="gap-14 rounded-22 p-16">
        <View className="flex-row items-center gap-12">
          <Icon name="phone" size={20} color={palette.navy.DEFAULT} />
          <T className="flex-1 text-14 leading-[20px]">Messages are processed on this phone.</T>
        </View>
        <View className="flex-row items-center gap-12">
          <Icon name="lock" size={20} color={palette.warning.ink} />
          <T className="flex-1 text-14 leading-[20px]">Only apps you switch on are read.</T>
        </View>
        <View className="flex-row items-center gap-12">
          <Icon name="shieldCheck" size={20} color={palette.mint.ink} />
          <T className="flex-1 text-14 leading-[20px]">Replies always need your approval.</T>
        </View>
      </Glass>

      <Glass className="rounded-18 px-14 py-12">
        <T accessibilityRole={error ? 'alert' : undefined} className="text-14 font-semibold text-ink-body">
          {status}
        </T>
      </Glass>

      <View className="mt-auto gap-10">
        {enabled ? (
          <PrimaryButton label="Continue" onPress={() => go('Setup', { firstRun: true })} />
        ) : (
          <PrimaryButton label="Open notification settings" onPress={openSettings} disabled={checking} />
        )}
        <SecondaryButton label="Check notification access" onPress={checkAccess} />
      </View>
    </Screen>
  );
}
