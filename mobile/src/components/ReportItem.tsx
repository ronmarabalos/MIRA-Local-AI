import { View } from 'react-native';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation';
import type { ReportItem as StoredItem } from '../core/report';
import { SourceQuote } from './SourceQuote';
import { T } from './T';
import { Tap } from './ui';

export function ReportItem({
  item,
  appLabel,
  dark = false,
  label,
}: {
  item: StoredItem;
  appLabel?: string;
  dark?: boolean;
  label?: string;
}) {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const summary =
    item.message.status === 'failed'
      ? "Couldn't read this message"
      : item.message.status === 'new'
      ? 'Reading this message…'
      : item.record?.summary ?? 'Original message';
  return (
    <Tap
      label={`Open message from ${item.message.sender}: ${summary}`}
      // The label line is otherwise only visual: this is how a screen reader hears it.
      accessibilityHint={label}
      onPress={() =>
        navigation.navigate('EmailDetail', { messageId: item.message.id })
      }
      glass={dark ? 'dark' : 'glass'}
      className="mb-10 min-h-48 gap-10 rounded-22 p-16"
    >
      <View className="gap-4">
        {label ? (
          <T
            className={`text-12 font-semibold ${
              dark ? 'text-dk-accent' : 'text-navy'
            }`}
          >
            {label}
          </T>
        ) : null}
        <T
          className={`text-12 font-semibold ${
            dark ? 'text-dk-text3' : 'text-ink-2'
          }`}
        >
          {item.message.sender}
        </T>
        <T
          className={`text-16 font-semibold ${
            dark ? 'text-dk-text' : 'text-ink'
          }`}
        >
          {summary}
        </T>
        {item.record && item.message.status === 'processed' ? (
          <T className={`text-12 ${dark ? 'text-dk-text3' : 'text-ink-2'}`}>
            MIRA summary
          </T>
        ) : null}
        {item.seen ? (
          <T
            className={`text-12 font-semibold ${
              dark ? 'text-dk-accent' : 'text-navy'
            }`}
          >
            {item.seen.chats > 1
              ? `Seen ${item.seen.times} times in ${item.seen.chats} chats`
              : `Sent ${item.seen.times} times`}
          </T>
        ) : null}
      </View>
      <SourceQuote item={item} appLabel={appLabel} dark={dark} />
    </Tap>
  );
}
