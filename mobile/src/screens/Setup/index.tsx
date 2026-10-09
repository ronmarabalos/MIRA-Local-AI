/** Board 03-initial-setup. */
import { useState } from 'react';
import { View } from 'react-native';

import { Icon } from '../../components/Icon';
import { useGo } from '../../components/nav';
import { Screen } from '../../components/Screen';
import { Steps } from '../../components/Steps';
import { T } from '../../components/T';
import { BackButton, Field, Glass, IconTile, PrimaryButton, Rows, Switch, Tap } from '../../components/ui';
import palette from '../../theme/palette';
import { usePrefs } from '../../theme/prefs';

function Badge({ text }: { text: string }) {
  return (
    <View className="rounded-full bg-white/60 px-10 py-6">
      <T className="text-12 font-bold text-ink-label">{text}</T>
    </View>
  );
}

export default function SetupScreen() {
  const go = useGo();
  const { name, setName } = usePrefs();
  const [notif, setNotif] = useState(true);
  const initial = (name.trim()[0] || 'A').toUpperCase();

  return (
    <Screen top={56} px={24} gap={22} bottom={36} fill>
      <View className="gap-10">
        <View className="flex-row items-center justify-between">
          <BackButton to="Onboarding" look="plain" />
          <T className="text-13 font-semibold text-ink-2">Step 1 of 3</T>
        </View>
        <Steps done={1} />
      </View>

      <T accessibilityRole="header" className="text-28 font-bold leading-[33.6px] tracking-[-0.56px]">
        What should MIRA call you?
      </T>

      <View className="flex-row items-center gap-16">
        <View className="h-72 w-72 items-center justify-center rounded-24 bg-peri-tonal">
          <T className="text-26 font-bold text-navy">{initial}</T>
        </View>
        <View className="gap-4">
          <Tap label="Add photo" className="h-44 flex-row items-center gap-8 rounded-14 border border-white/80 bg-white/60 px-16">
            <Icon name="camera" size={18} />
            <T className="text-14 font-semibold">Add photo</T>
          </Tap>
          <T className="text-12 text-ink-muted">Optional</T>
        </View>
      </View>

      <View className="gap-8">
        <T className="text-13 font-bold">Your name</T>
        <Field
          accessibilityLabel="Your name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Alex"
          autoCapitalize="words"
          returnKeyType="done"
          className="h-56 rounded-16 border-[1.5px] border-peri-600 bg-white/60 px-16 text-17 font-semibold"
        />
      </View>

      <Glass className="rounded-22 px-16 py-6">
        <Rows>
          <View className="flex-row items-center gap-12 py-12">
            <IconTile name="bell" fg={palette.warning.ink} bg={palette.warning.bg} />
            <T className="flex-1 text-14 font-bold">Notifications</T>
            <Switch on={notif} onPress={() => setNotif(!notif)} label="Allow notifications" />
          </View>
          <View className="flex-row items-center gap-12 py-12">
            <IconTile name="phone" fg={palette.navy.DEFAULT} bg={palette.peri.tonal} />
            <T className="flex-1 text-14 font-bold">On-device AI model</T>
            <Badge text="Next" />
          </View>
          <View className="flex-row items-center gap-12 py-12">
            <IconTile name="link" fg={palette.mint.ink} bg={palette.mint.bg} />
            <View className="flex-1 gap-2">
              <T className="text-14 font-bold">Connect email & calendar</T>
              <T className="text-12 leading-[16.8px] text-ink-muted">Optional</T>
            </View>
            <Badge text="Later" />
          </View>
        </Rows>
      </Glass>

      <View className="mt-auto">
        <PrimaryButton
          label={name.trim() ? `Continue as ${name.trim()}` : 'Continue'}
          onPress={() => go('ModelSetup')}
        />
      </View>
    </Screen>
  );
}
