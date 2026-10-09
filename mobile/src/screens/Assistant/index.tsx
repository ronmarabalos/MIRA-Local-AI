/** Board 06-mira-assistant: the chat with MIRA, with the board's demo replies. */
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { KeyboardAvoidingView, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Companion, type CompanionMode } from '../../components/Companion';
import { DotsIcon, D, Icon } from '../../components/Icon';
import { FadeIn, PulseDot } from '../../components/motion';
import { useGo } from '../../components/nav';
import { useStatusBar } from '../../components/Screen';
import { SilkBackground } from '../../components/SilkBackground';
import { T } from '../../components/T';
import { BackButton, Field, Tap } from '../../components/ui';
import { fx } from '../../theme/effects';
import palette from '../../theme/palette';
import { useDisplayName } from '../../theme/prefs';

type Msg =
  | { kind: 'user'; text: string; time: string }
  | { kind: 'mira'; text: string; time: string; doneNote?: boolean }
  | { kind: 'error'; text: string; time: string }
  | { kind: 'card' };

type Reply = { kind: 'mira' | 'error'; text: string };

function now(): string {
  const d = new Date();
  const h = d.getHours();
  return `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

const STARTERS: { label: string; icon: string; ask: string; reply: Reply }[] = [
  {
    label: 'Plan my afternoon',
    icon: D.calendar,
    ask: 'Plan my afternoon.',
    reply: { kind: 'mira', text: 'Q3 report first, then reply to Sam before 6 PM.' },
  },
  {
    label: 'Summarize my unread email',
    icon: D.mail,
    ask: 'Summarize my unread email.',
    reply: { kind: 'mira', text: 'Maya wants to move your 1:1. Priya sent the final Q3 numbers.' },
  },
  {
    label: 'What did I teach you?',
    icon: D.bulb,
    ask: 'What did I teach you?',
    reply: { kind: 'mira', text: 'Five preferences, like friendly, concise emails. See Personal Memory.' },
  },
];

const FOLLOW_UPS: { label: string; ask: string; reply: Reply }[] = [
  {
    label: 'Email Priya the draft',
    ask: 'Email Priya the report draft too.',
    reply: { kind: 'error', text: 'You’re offline. I saved a draft and will ask before sending.' },
  },
  {
    label: 'Block focus time',
    ask: 'Block focus time this afternoon.',
    reply: { kind: 'mira', text: 'You’re free 2–4 PM. Add a focus block?' },
  },
];

const FIRST: Msg[] = [
  { kind: 'user', text: 'Remind me to submit my report tomorrow.', time: '8:30 AM' },
  { kind: 'mira', text: 'Of course! What time would you like me to remind you?', time: '8:30 AM' },
  { kind: 'user', text: '8 AM, before the deadline.', time: '8:31 AM' },
  { kind: 'mira', text: 'Confirm to create it.', time: '8:31 AM' },
  { kind: 'card' },
];

function ReminderCard({ done, onConfirm }: { done: boolean; onConfirm(): void }) {
  const go = useGo();
  return (
    <FadeIn className="gap-12 rounded-26 bg-white/88 p-16" style={fx.chatCard}>
      <View className="flex-row items-center gap-10">
        <Icon name="bell" size={20} strokeWidth={1.9} />
        <T className="flex-1 text-15 font-semibold">Reminder · Submit Q3 report</T>
        <View className={`rounded-full px-8 py-4 ${done ? 'bg-success-bg' : 'bg-warning-bg'}`}>
          <T className={`text-11 font-semibold ${done ? 'text-success-ink' : 'text-warning-ink'}`}>
            {done ? 'Created' : 'Needs your OK'}
          </T>
        </View>
      </View>
      <T className="text-14 text-ink-body">Tomorrow · 8:00 AM</T>
      {done ? (
        <Tap
          label="Created, view in Planner"
          onPress={() => go('Tasks')}
          className="h-40 flex-row items-center justify-center gap-6 rounded-full bg-success-bg"
        >
          <Icon name="check" size={15} strokeWidth={2.4} color={palette.success.ink} />
          <T className="text-13 font-semibold text-success-ink">Created · view in Planner</T>
        </Tap>
      ) : (
        <View className="flex-row items-center gap-8 pt-2">
          <Tap label="Edit" onPress={() => go('Tasks')} className="h-40 justify-center rounded-full border border-ink/12 px-16">
            <T className="text-13 font-semibold">Edit</T>
          </Tap>
          <Tap label="Confirm" onPress={onConfirm} className="h-40 flex-row items-center gap-6 rounded-full bg-ink px-16">
            <T className="text-13 font-semibold text-white">Confirm</T>
            <Icon name="arrowRight" size={14} strokeWidth={2.4} color={palette.white} />
          </Tap>
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

  const [messages, setMessages] = useState<Msg[]>(FIRST);
  const [draft, setDraft] = useState('');
  const [thinking, setThinking] = useState(false);
  const [listening, setListening] = useState(false);
  const [responding, setResponding] = useState(false);
  const [reminderDone, setReminderDone] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const reply = (userText: string, answer: Reply) => {
    setMessages((m) => [...m, { kind: 'user', text: userText, time: now() }]);
    setThinking(true);
    setListening(false);
    setDraft('');
    timers.current.push(
      setTimeout(() => {
        setThinking(false);
        setResponding(true);
        setMessages((m) => [...m, { ...answer, time: now() }]);
        timers.current.push(setTimeout(() => setResponding(false), 2600));
      }, 1400),
    );
  };

  const send = () => {
    const text = draft.trim();
    if (text) {
      reply(text, { kind: 'mira', text: '(Demo) Got it.' });
    }
  };

  const stop = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setThinking(false);
  };

  const confirmReminder = () => {
    setReminderDone(true);
    setMessages((m) => [
      ...m,
      { kind: 'mira', doneNote: true, text: 'Done. I’ll remind you tomorrow at 8:00 AM. Anything else for the report?', time: now() },
    ]);
  };

  const last = messages[messages.length - 1];
  const showFollowUps = reminderDone && !thinking && last.kind === 'mira' && !!last.doneNote;
  const mode: CompanionMode = thinking ? 'thinking' : listening ? 'listening' : responding ? 'responding' : 'idle';
  const status = thinking ? 'Thinking on device' : listening ? 'Listening' : 'Running on device';
  const hasText = !!draft.trim();

  return (
    <View className="flex-1 bg-silk-base">
      <SilkBackground />
      <View className="flex-row items-start justify-between px-16" style={{ paddingTop: insets.top + 8, height: insets.top + 76 }}>
        <BackButton to="Home" label="Back to Home" look="round" />
        <View className="mt-4 h-36 flex-row items-center gap-6 rounded-full border border-white/80 bg-white/46 px-12" style={fx.glass}>
          <View className="h-7 w-7 rounded-full bg-success" />
          <T className="text-12 font-semibold text-success-ink">{status}</T>
        </View>
        <View className="flex-row gap-6">
          <Tap label="Conversation history" onPress={() => go('Activity')} glass="glass" className="h-44 w-44 items-center justify-center rounded-full">
            <Icon name="history" size={19} />
          </Tap>
          <Tap label="More options" glass="glass" className="h-44 w-44 items-center justify-center rounded-full">
            <DotsIcon />
          </Tap>
        </View>
      </View>

      <KeyboardAvoidingView behavior="padding" className="mt-8 flex-1">
        <View
          accessibilityLabel="Conversation with MIRA"
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
              <Companion size={80} mode={mode} />
            </View>
            <T accessibilityRole="header" className="text-26 font-light leading-[31.7px] tracking-[-0.78px]">
              {name}, how can I help you this morning?
            </T>
            <View className="gap-8">
              {STARTERS.map((s) => (
                <Tap
                  key={s.label}
                  label={s.label}
                  onPress={() => reply(s.ask, s.reply)}
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

            {messages.map((m, i) => {
              if (m.kind === 'card') {
                return <ReminderCard key={i} done={reminderDone} onConfirm={confirmReminder} />;
              }
              if (m.kind === 'user') {
                return (
                  <FadeIn key={i} className="max-w-[80%] items-end gap-4 self-end">
                    <View className="rounded-t-20 rounded-bl-20 rounded-br-6 bg-white/92 px-14 py-12" style={fx.bubble}>
                      <T className="text-15 leading-[21.75px]">{m.text}</T>
                    </View>
                    <T className="text-11 text-ink-muted">{m.time}</T>
                  </FadeIn>
                );
              }
              if (m.kind === 'error') {
                return (
                  <FadeIn
                    key={i}
                    className="max-w-[92%] flex-row gap-10 self-start rounded-20 border border-warning-line px-14 py-12"
                    style={{ backgroundColor: 'rgba(255,248,238,0.85)' }}
                  >
                    <View className="mt-1">
                      <Icon name="wifiOff" size={18} color={palette.warning.ink} />
                    </View>
                    <View className="shrink gap-6">
                      <T className="text-14 leading-[20.3px] text-warning-text">{m.text}</T>
                      <View className="self-start rounded-full bg-white/80 px-8 py-3">
                        <T className="text-11 font-semibold text-ink-label">Queued</T>
                      </View>
                    </View>
                  </FadeIn>
                );
              }
              return (
                <FadeIn key={i} className="max-w-[92%] gap-6 self-start">
                  <View className="flex-row items-center gap-6">
                    <Companion size={24} mode="responding" />
                    <T className="text-12 text-ink-muted">MIRA · {m.time}</T>
                  </View>
                  <T className="text-15 leading-[22.5px]">{m.text}</T>
                </FadeIn>
              );
            })}

            {showFollowUps ? (
              <View className="flex-row flex-wrap gap-8">
                {FOLLOW_UPS.map((c) => (
                  <Tap
                    key={c.label}
                    label={c.label}
                    onPress={() => reply(c.ask, c.reply)}
                    className="h-40 justify-center rounded-full border border-white/90 bg-white/60 px-14"
                  >
                    <T className="text-13 font-semibold">{c.label}</T>
                  </Tap>
                ))}
              </View>
            ) : null}

            {thinking ? (
              <View accessibilityLiveRegion="polite" className="flex-row items-center gap-8">
                <PulseDot className="h-6 w-6 rounded-full bg-navy" />
                <PulseDot delay={200} className="h-6 w-6 rounded-full bg-navy" />
                <T className="text-13 text-ink-muted">Thinking on your device…</T>
              </View>
            ) : null}
          </ScrollView>

          <View className="gap-8 px-14 pt-8" style={{ paddingBottom: Math.max(30, insets.bottom + 12) }}>
            {thinking ? (
              <View className="h-60 flex-row items-center justify-between px-4">
                <View className="h-48 w-48 items-center justify-center rounded-full bg-white/50">
                  <Icon name="plus" size={20} color={palette.ink.faint} />
                </View>
                <Companion size={52} mode="thinking" />
                <Tap label="Stop" onPress={stop} className="h-48 w-48 items-center justify-center rounded-full bg-navy-night">
                  <View className="h-14 w-14 rounded-3 bg-white" />
                </Tap>
              </View>
            ) : (
              <View className="h-60 flex-row items-center gap-8 rounded-full border border-white/95 bg-white/72 px-8" style={fx.composer}>
                <Tap label="Attach a local file" className="h-44 w-44 items-center justify-center rounded-full bg-ink/6">
                  <Icon name="plus" size={20} />
                </Tap>
                <Field
                  accessibilityLabel="Message MIRA"
                  value={draft}
                  onChangeText={setDraft}
                  onSubmitEditing={send}
                  returnKeyType="send"
                  placeholder="Enter message…"
                  className="h-44 min-w-0 flex-1 text-15"
                />
                {hasText ? (
                  <Tap label="Send" onPress={send} className="h-44 w-44 items-center justify-center rounded-full bg-navy" style={fx.sendBtn}>
                    <Icon name="arrowRight" size={18} strokeWidth={2.2} color={palette.white} />
                  </Tap>
                ) : (
                  <Tap
                    label="Speak to MIRA"
                    accessibilityState={{ selected: listening }}
                    onPress={() => setListening(!listening)}
                    className="h-44 w-44 items-center justify-center rounded-full"
                    style={{ backgroundColor: listening ? 'rgba(46,58,120,0.12)' : 'transparent' }}
                  >
                    <Icon name="mic" size={20} strokeWidth={1.9} />
                  </Tap>
                )}
              </View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
