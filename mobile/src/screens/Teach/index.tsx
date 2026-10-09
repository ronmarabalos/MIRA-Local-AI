/** Board 07-teach-mira: the helpers MIRA can switch on. */
import { View } from 'react-native';

import { RulesPanel } from '../../components/RulesPanel';
import { Screen } from '../../components/Screen';
import { T } from '../../components/T';

export default function TeachScreen() {
  return (
    <Screen tab="Teach">
      <View className="gap-4">
        <T accessibilityRole="header" className="text-30 font-medium tracking-[-0.9px]">
          Teach MIRA
        </T>
        <T className="text-15 text-ink-2">Choose what MIRA does for you.</T>
      </View>
      <RulesPanel summary />
    </Screen>
  );
}
