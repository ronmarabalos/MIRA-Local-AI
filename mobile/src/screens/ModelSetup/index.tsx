/** First visit, step 2 of 3 (board 04): get MIRA's file onto the phone. */
import { View } from 'react-native';

import { MiraFilePanel } from '../../components/MiraFilePanel';
import { useGo } from '../../components/nav';
import { Screen } from '../../components/Screen';
import { Steps } from '../../components/Steps';
import { T } from '../../components/T';
import { BackButton } from '../../components/ui';

export default function ModelSetupScreen() {
  const go = useGo();
  const next = () => go('ConnectedApps', { firstRun: true });
  return (
    <Screen top={56} px={24} gap={20} bottom={32} fill>
      <View className="gap-10">
        <View className="flex-row items-center justify-between">
          <BackButton to="Setup" look="plain" />
          <T className="text-13 font-semibold text-ink-2">Step 2 of 3</T>
        </View>
        <Steps done={2} />
      </View>
      <MiraFilePanel
        next={{ label: 'Continue', onPress: next }}
        skip={{ label: 'Continue for now', onPress: next }}
      />
    </Screen>
  );
}
