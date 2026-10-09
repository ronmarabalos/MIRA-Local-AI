/**
 * Board 06-mira-assistant. Ask is a lookup over stored records (task B4.4):
 * every answer is a record field with the message it came from. No model call.
 */
import { useRef, useState, type ComponentRef } from 'react';
import { KeyboardAvoidingView, ScrollView, View } from 'react-native';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ask, NOT_FOUND, type AskAnswer } from '../../core/ask';
import type { ReportLine } from '../../core/report';
import { Companion } from '../../components/Companion';
import { D, Icon } from '../../components/Icon';
import { FadeIn } from '../../components/motion';
import { useGo } from '../../components/nav';
import { useStatusBar } from '../../components/Screen';
import { SilkBackground } from '../../components/SilkBackground';
import { SourceQuote } from '../../components/SourceQuote';
import { T } from '../../components/T';
import { BackButton, Field, Tap } from '../../components/ui';
import type { RootStackParamList } from '../../navigation';
import { useQuery } from '../../services/db/hooks';
import { fx } from '../../theme/effects';
import palette from '../../theme/palette';
import { useDisplayName } from '../../theme/prefs';

const DAY = 24 * 60 * 60 * 1000;
/** How far back Ask searches, and how many messages at most. */
const SEARCH_DAYS = 30;
const SEARCH_LIMIT = 500;

type Turn = { id: number; question: string; answer: AskAnswer; time: string };

const STARTERS = [
  { label: 'When is the next deadline?', icon: D.calendar },
  { label: 'How much do I need to pay?', icon: D.mail },
  { label: 'What do I need to do?', icon: D.bulb },
];

const FIELD_LABEL = { date: 'Date', amount: 'Amount', request: 'What to do', summary: 'Found' } as const;

function clock(time: number): string {
  const d = new Date(time);
  const h = d.getHours();
  return `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function Answer({ turn }: { turn: Turn }) {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const open = (line: ReportLine) => navigation.navigate('EmailDetail', { messageId: line.message.id });
  const { answer } = turn;
  return (
    <FadeIn className="max-w-[92%] gap-6 self-start">
      <View className="flex-row items-center gap-6">
        <Companion size={24} mode="responding" />
        <T className="text-12 text-ink-muted">MIRA · {turn.time}</T>
      </View>
      {answer.kind === 'none' ? (
        <T accessibilityLiveRegion="polite" className="text-15 leading-[22.5px]">{NOT_FOUND}</T>
      ) : (
        <View className="gap-10">
          <View className="gap-2">
            <T className="text-12 font-semibold text-navy">{FIELD_LABEL[answer.field]}</T>
            <T className="text-18 font-semibold">{answer.value}</T>
            {answer.field !== 'summary' ? (
              <T className="text-14 text-ink-body">{answer.line.record.summary}</T>
            ) : null}
          </View>
          <Tap
            label={`Open message from ${answer.line.message.sender}`}
            onPress={() => open(answer.line)}
            className="min-h-48"
          >
            <SourceQuote item={answer.line} />
          </Tap>
          {answer.more.length ? (
            <View className="gap-6">
              <T className="text-12 font-semibold text-ink-2">Also found</T>
              {answer.more.map(line => (
                <Tap
                  key={line.message.id}
                  label={`Open message from ${line.message.sender}: ${line.record.summary}`}
                  onPress={() => open(line)}
                  className="min-h-48 flex-row items-center gap-8 rounded-16 bg-white/55 px-12"
                >
                  <T className="flex-1 text-14" numberOfLines={2}>
                    {line.record.summary}
                  </T>
                  <Icon name="chevronRight" size={16} color={palette.ink.muted} />
                </Tap>
              ))}
            </View>
          ) : null}
        </View>
      )}
    </FadeIn>
  );
}

export default function AssistantScreen() {
  const go = useGo();
  const name = useDisplayName();
  const insets = useSafeAreaInsets();
  useStatusBar(false);

  const items = useQuery(store => {
    const now = Date.now();
    return store.getItems(now - SEARCH_DAYS * DAY, now + DAY, SEARCH_LIMIT);
  }, []);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState('');
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);

  const submit = (question: string) => {
    const text = question.trim();
    if (!text || !items.data) return;
    const now = Date.now();
    setTurns(t => [...t, { id: now + t.length, question: text, answer: ask(text, items.data!, now), time: clock(now) }]);
    setDraft('');
  };

  const ready = items.data !== undefined;
  const status = items.error ? 'Messages not loaded' : ready ? 'Running on device' : 'Loading messages';

  return (
    <View className="flex-1 bg-silk-base">
      <SilkBackground />
      <View className="flex-row items-start justify-between px-16" style={{ paddingTop: insets.top + 8, height: insets.top + 76 }}>
        <BackButton to="Home" label="Back to Home" look="round" />
        <View className="mt-4 h-36 flex-row items-center gap-6 rounded-full border border-white/80 bg-white/46 px-12" style={fx.glass}>
          <View className={`h-7 w-7 rounded-full ${items.error ? 'bg-error' : 'bg-success'}`} />
          <T className={`text-12 font-semibold ${items.error ? 'text-error-ink' : 'text-success-ink'}`}>{status}</T>
        </View>
        <Tap label="Activity" onPress={() => go('Activity')} glass="glass" className="h-44 w-44 items-center justify-center rounded-full">
          <Icon name="history" size={19} />
        </Tap>
      </View>

      <KeyboardAvoidingView behavior="padding" className="mt-8 flex-1">
        <View
          accessibilityLabel="Ask MIRA about your messages"
          className="flex-1 rounded-t-34 border-t border-white/95"
          style={fx.chatSheet}
        >
          <View className="mb-4 mt-10 h-4 w-36 self-center rounded-full bg-ink/18" />
          <ScrollView
            ref={scroll}
            className="flex-1"
            contentContainerClassName="gap-14 px-18 pb-12 pt-10"
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
          >
            <View className="-mb-6 -mt-2 items-center">
              <Companion size={80} mode="idle" />
            </View>
            <T accessibilityRole="header" className="text-26 font-light leading-[31.7px] tracking-[-0.78px]">
              Ask MIRA
            </T>
            <T className="-mt-8 text-15 leading-[22px] text-ink-body">
              {name}, ask about dates, amounts, and requests in your messages. Each answer shows the message it came from.
            </T>
            {items.error ? (
              <View className="gap-8 rounded-20 border border-warning-line bg-white/70 p-14">
                <T className="text-14 text-warning-text">Your messages couldn't be loaded on this phone.</T>
                <Tap label="Try again" onPress={items.retry} className="min-h-48 justify-center self-start">
                  <T className="text-14 font-semibold text-navy">Try again</T>
                </Tap>
              </View>
            ) : null}
            <View className="gap-8">
              {STARTERS.map(s => (
                <Tap
                  key={s.label}
                  label={s.label}
                  disabled={!ready}
                  onPress={() => submit(s.label)}
                  className="h-48 flex-row items-center gap-10 rounded-full border border-white/90 bg-white/55 pl-6 pr-12"
                >
                  <View className="h-36 w-36 items-center justify-center rounded-full bg-white/90">
                    <Icon d={s.icon} size={16} color={palette.navy.DEFAULT} />
                  </View>
                  <T className="flex-1 text-14 font-medium">{s.label}</T>
                  <Icon name="chevronRight" size={16} color={palette.ink.muted} />
                </Tap>
              ))}
            </View>

            {turns.map(turn => (
              <View key={turn.id} className="gap-14">
                <FadeIn className="max-w-[80%] items-end gap-4 self-end">
                  <View className="rounded-t-20 rounded-bl-20 rounded-br-6 bg-white/92 px-14 py-12" style={fx.bubble}>
                    <T className="text-15 leading-[21.75px]">{turn.question}</T>
                  </View>
                  <T className="text-11 text-ink-muted">{turn.time}</T>
                </FadeIn>
                <Answer turn={turn} />
              </View>
            ))}
          </ScrollView>

          <View className="px-14 pt-8" style={{ paddingBottom: Math.max(30, insets.bottom + 12) }}>
            <View className="h-60 flex-row items-center gap-8 rounded-full border border-white/95 bg-white/72 pl-18 pr-8" style={fx.composer}>
              <Field
                accessibilityLabel="Question for MIRA"
                value={draft}
                onChangeText={setDraft}
                onSubmitEditing={() => submit(draft)}
                returnKeyType="search"
                placeholder="Ask about your messages…"
                className="h-44 min-w-0 flex-1 text-15"
              />
              <Tap
                label="Ask"
                disabled={!ready || !draft.trim()}
                onPress={() => submit(draft)}
                className={`h-44 w-44 items-center justify-center rounded-full ${draft.trim() ? 'bg-navy' : 'bg-ink/6'}`}
                style={draft.trim() ? fx.sendBtn : undefined}
              >
                <Icon name="arrowRight" size={18} strokeWidth={2.2} color={draft.trim() ? palette.white : palette.ink.faint} />
              </Tap>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
