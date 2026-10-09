import { View } from 'react-native';

/** The segmented step bar under setup and teaching headers. */
export function Steps({ done, total = 3 }: { done: number; total?: number }) {
  return (
    <View accessibilityLabel={`Step ${done} of ${total}`} className="flex-row gap-6">
      {Array.from({ length: total }, (_, i) => (
        <View key={i} className={`h-6 flex-1 rounded-full ${i < done ? 'bg-navy' : 'bg-peri-150'}`} />
      ))}
    </View>
  );
}
