/** Board 14: MIRA's summary alongside the original stored notification. */
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRoute, type RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../navigation';
import { Companion } from '../../components/Companion';
import { useGo } from '../../components/nav';
import { Sheet } from '../../components/Overlay';
import { Screen } from '../../components/Screen';
import { SourceQuote } from '../../components/SourceQuote';
import { T } from '../../components/T';
import { BackButton, Glass, Tap } from '../../components/ui';
import type { RecordType } from '../../core/types';
import { getStore } from '../../services/db';
import { useChannels, useItem } from '../../services/db/hooks';
import { fx } from '../../theme/effects';

const CATEGORIES: Record<RecordType, string> = {
  request: 'Request',
  question: 'Question',
  deadline: 'Deadline',
  payment: 'Payment',
  schedule_change: 'Schedule change',
  announcement: 'Announcement',
  chatter: 'Chatter',
  promotion: 'Promotion',
  other: 'Other',
};
const styles = StyleSheet.create({ categories: { gap: 8 } });

export default function EmailDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'EmailDetail'>>();
  const id = route.params?.messageId;
  return (
    <Screen gap={18}>
      <BackButton to="Home" label="Back to report" />
      {id ? <StoredDetail key={id} messageId={id} /> : <MissingMessage />}
    </Screen>
  );
}

function MissingMessage() {
  const go = useGo();
  return (
    <Glass className="gap-10 rounded-22 p-18">
      <T accessibilityRole="header" className="text-20 font-semibold">
        Message not found
      </T>
      <T className="text-14 leading-[22px] text-ink-2">
        Choose a saved message from Today. This message may have been deleted.
      </T>
      <Tap label="Open Today" onPress={() => go('Home')} className="min-h-48 justify-center">
        <T className="text-15 font-semibold text-navy">Open Today</T>
      </Tap>
    </Glass>
  );
}

function StoredDetail({ messageId }: { messageId: string }) {
  const { data: item, error, retry } = useItem(messageId);
  const { data: channels } = useChannels();
  const [choosing, setChoosing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  async function correct(type: RecordType) {
    if (saving) return;
    setSaving(true);
    setFeedback('');
    try {
      const store = await getStore();
      // Read again so a correction cannot overwrite a newer extraction or recreate deleted data.
      const latest = await store.getItem(messageId);
      if (!latest?.record || latest.message.status === 'new' || latest.message.status === 'failed') {
        setFeedback('The message changed. Open it again before changing its category.');
        retry();
      } else {
        await store.saveRecord({ ...latest.record, type }, latest.message.status);
        setFeedback('Category saved');
      }
    } catch {
      setFeedback('Could not save category. Try changing it again.');
    } finally {
      setSaving(false);
      setChoosing(false);
    }
  }

  if (error)
    return (
      <Glass className="gap-8 rounded-22 p-18" accessibilityRole="alert">
        <T className="text-18 font-semibold">Could not load this message</T>
        <T className="text-14 text-ink-2">Try reading the saved message again.</T>
        <Tap label="Retry" onPress={retry} className="min-h-48 justify-center">
          <T className="text-15 font-semibold text-navy">Retry</T>
        </Tap>
      </Glass>
    );
  if (item === undefined)
    return (
      <Glass accessibilityState={{ busy: true }} className="gap-12 rounded-22 p-18">
        <T className="text-14 text-ink-2">Loading saved message</T>
        <View className="h-14 w-3/4 rounded-full bg-white/60" />
        <View className="h-48 rounded-14 bg-white/60" />
      </Glass>
    );
  if (item === null) return <MissingMessage />;

  const { message, record } = item;
  const readable = record && message.status !== 'new' && message.status !== 'failed';
  return (
    <>
      <View className="gap-6">
        <T accessibilityRole="header" className="text-24 font-semibold">
          Message from {message.sender}
        </T>
        <T className="text-13 text-ink-2">{new Date(message.postedAt).toLocaleString()}</T>
        <T className="text-12 text-ink-2">Saved messages are available offline.</T>
      </View>
      {readable ? (
        <View className="gap-10 rounded-20 border border-white/80 p-16" style={fx.summary}>
          <View className="flex-row items-center gap-8">
            <Companion size={24} />
            <T className="text-12 font-semibold text-navy">MIRA SUMMARY</T>
          </View>
          <T className="text-16 leading-[24px] text-ink-deep">{record.summary}</T>
          <T className="text-14 text-ink-2">{CATEGORIES[record.type]}</T>
          {record.dateText ? (
            <T className="text-14 text-ink-2">{`Date mentioned: ${record.dateText}`}</T>
          ) : null}
          {record.amount ? (
            <T className="text-14 text-ink-2">{`Amount mentioned: ${record.amount}`}</T>
          ) : null}
          {record.instructionLike ? (
            <T className="text-14 text-ink-2">
              This message contains instructions aimed at an assistant. Check the original below.
            </T>
          ) : null}
        </View>
      ) : (
        <Glass className="gap-8 rounded-20 p-16">
          <T className="text-16 font-semibold">
            {message.status === 'failed' ? "Couldn't read this message" : 'Reading this message…'}
          </T>
          <T className="text-14 text-ink-2">You can still read the original below.</T>
        </Glass>
      )}
      <T accessibilityRole="header" className="text-20 font-semibold">
        Original message
      </T>
      <SourceQuote
        item={item}
        appLabel={channels?.find(channel => channel.packageName === message.packageName)?.label}
        expandable
      />
      {readable ? (
        <Tap
          label="Change category"
          disabled={saving}
          accessibilityState={{ disabled: saving }}
          onPress={() => setChoosing(true)}
          className="min-h-48 justify-center"
        >
          <T className="text-15 font-semibold text-navy">{saving ? 'Saving category…' : 'Change category'}</T>
        </Tap>
      ) : null}
      {feedback ? (
        <T accessibilityLiveRegion="polite" className="text-14 text-ink-2">
          {feedback}
        </T>
      ) : null}
      <Sheet visible={choosing} onClose={() => !saving && setChoosing(false)} label="Change category">
        <T className="text-20 font-semibold">Change category</T>
        <ScrollView className="max-h-360" contentContainerStyle={styles.categories}>
          {(Object.keys(CATEGORIES) as RecordType[]).map(type => (
            <Tap
              key={type}
              label={CATEGORIES[type]}
              disabled={saving}
              accessibilityState={{
                disabled: saving,
                selected: record?.type === type,
              }}
              onPress={() => correct(type)}
              className="min-h-48 justify-center rounded-14 px-12"
            >
              <T className="text-15 text-ink">{CATEGORIES[type]}</T>
            </Tap>
          ))}
        </ScrollView>
      </Sheet>
    </>
  );
}
