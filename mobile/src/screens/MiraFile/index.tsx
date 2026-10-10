/** MIRA on this phone: download, resume, or replace MIRA's file at any time. Opened from Settings. */
import { View } from 'react-native';

import { MiraFilePanel } from '../../components/MiraFilePanel';
import { Screen } from '../../components/Screen';
import { T } from '../../components/T';
import { BackButton } from '../../components/ui';

export default function MiraFileScreen() {
  return (
    <Screen top={56} px={24} gap={20} bottom={32} fill>
      <View className="flex-row items-center">
        <BackButton to="Settings" label="Back to Settings" />
      </View>
      <T accessibilityRole="header" className="text-30 font-medium tracking-[-0.9px]">
        MIRA on this phone
      </T>
      <MiraFilePanel />
    </Screen>
  );
}
