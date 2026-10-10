/**
 * Board 03-initial-setup. On the first visit this is step 1 of 3; opened
 * later from Profile it is Personal information, with no step bar.
 */
import { View } from 'react-native';
import { useRoute, type RouteProp } from '@react-navigation/native';

import type { RootStackParamList } from '../../navigation';
import { useBack, useGo } from '../../components/nav';
import { Screen } from '../../components/Screen';
import { Steps } from '../../components/Steps';
import { T } from '../../components/T';
import { BackButton, Field, Glass, IconTile, PrimaryButton, Rows } from '../../components/ui';
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
  const back = useBack('Profile');
  const firstRun = useRoute<RouteProp<RootStackParamList, 'Setup'>>().params?.firstRun ?? false;
  const { name, setName } = usePrefs();
  const initial = (name.trim()[0] || 'A').toUpperCase();

  return (
    <Screen top={56} px={24} gap={22} bottom={36} fill>
      {firstRun ? (
        <View className="gap-10">
          <View className="flex-row items-center justify-between">
            <BackButton to="Onboarding" look="plain" />
            <T className="text-13 font-semibold text-ink-2">Step 1 of 3</T>
          </View>
          <Steps done={1} />
        </View>
      ) : (
        <View className="flex-row items-center">
          <BackButton to="Profile" label="Back to Profile" />
        </View>
      )}

      <T accessibilityRole="header" className="text-28 font-bold leading-[33.6px] tracking-[-0.56px]">
        {firstRun ? 'What should MIRA call you?' : 'Personal information'}
      </T>

      <View className="flex-row items-center gap-16">
        <View className="h-72 w-72 items-center justify-center rounded-24 bg-peri-tonal">
          <T className="text-26 font-bold text-navy">{initial}</T>
        </View>
        <T className="flex-1 text-14 leading-[21px] text-ink-2">MIRA uses your name on Today and in your profile. It stays on this phone.</T>
      </View>

      <View className="gap-8">
        <T className="text-13 font-bold">Your name</T>
        <Field
          accessibilityLabel="Your name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Alex"
          autoCapitalize="words"
          maxLength={40}
          returnKeyType="done"
          className="h-56 rounded-16 border-[1.5px] border-peri-600 bg-white/60 px-16 text-17 font-semibold"
        />
      </View>

      {firstRun ? (
        <Glass className="rounded-22 px-16 py-6">
          <Rows>
            <View className="flex-row items-center gap-12 py-12">
              <IconTile name="bell" fg={palette.warning.ink} bg={palette.warning.bg} />
              <View className="flex-1 gap-2">
                <T className="text-14 font-bold">Reminders</T>
                <T className="text-12 leading-[16.8px] text-ink-muted">Android may ask before the first one</T>
              </View>
              <Badge text="Later" />
            </View>
            <View className="flex-row items-center gap-12 py-12">
              <IconTile name="phone" fg={palette.navy.DEFAULT} bg={palette.peri.tonal} />
              <T className="flex-1 text-14 font-bold">Runs on this phone</T>
              <Badge text="Next" />
            </View>
          </Rows>
        </Glass>
      ) : null}

      <View className="mt-auto">
        {firstRun ? (
          <PrimaryButton
            label={name.trim() ? `Continue as ${name.trim()}` : 'Continue'}
            onPress={() => go('ModelSetup')}
          />
        ) : (
          // The name is saved as it is typed; this only closes the page.
          <PrimaryButton label="Done" onPress={back} />
        )}
      </View>
    </Screen>
  );
}
