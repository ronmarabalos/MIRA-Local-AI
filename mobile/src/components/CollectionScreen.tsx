import type { ReactNode } from 'react';
import { FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SilkBackground } from './SilkBackground';
import { useStatusBar } from './Screen';

/** The board's scrolling surface for app, activity, and draft collections. */
export function CollectionScreen<T>({
  rows,
  keyFor,
  row,
  header,
  footer,
}: {
  rows: T[];
  keyFor(item: T): string;
  row(item: T): ReactNode;
  header: ReactNode;
  footer?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  useStatusBar(false);
  return (
    <View className="flex-1 bg-silk-base">
      <SilkBackground />
      <FlatList
        data={rows}
        keyExtractor={keyFor}
        renderItem={({ item }) => <View className="pb-16">{row(item)}</View>}
        ListHeaderComponent={<View className="gap-16 pb-16">{header}</View>}
        ListFooterComponent={<View className="gap-16">{footer}</View>}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 40,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
