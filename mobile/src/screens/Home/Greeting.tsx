/** Today's top: MIRA asks how it can help, and asks to get to know the user. */
import { View } from 'react-native';

import { Companion } from '../../components/Companion';
import { Icon, type IconName } from '../../components/Icon';
import { useGo, type Board } from '../../components/nav';
import { T } from '../../components/T';
import { Glass, IconTile, Tap } from '../../components/ui';
import type { Channel } from '../../core/types';
import { useRules } from '../../services/db/hooks';
import palette from '../../theme/palette';
import { usePrefs } from '../../theme/prefs';

/** MIRA's question and a bar that opens Ask MIRA. */
export function Greeting({ dark, thinking }: { dark: boolean; thinking: boolean }) {
  const go = useGo();
  const name = usePrefs().name.trim();
  const ink = dark ? 'text-dk-text' : 'text-ink';
  const sub = dark ? 'text-dk-text3' : 'text-ink-2';
  return (
    <Glass kind={dark ? 'dark' : 'glass'} className="gap-14 rounded-30 p-18">
      <View className="flex-row items-center gap-14">
        <Companion size={52} theme={dark ? 'dark' : 'light'} mode={thinking ? 'thinking' : 'idle'} />
        <View className="flex-1 gap-2">
          <T className={`text-14 ${sub}`}>{name ? `Hi ${name}!` : 'Hi there!'}</T>
          <T accessibilityRole="header" className={`text-20 font-semibold leading-[26px] ${ink}`}>
            What can I help you with today?
          </T>
        </View>
      </View>
      <Tap
        label="Ask MIRA"
        onPress={() => go('Assistant')}
        className={`min-h-48 flex-row items-center gap-10 rounded-16 border px-14 ${
          dark ? 'border-white/10 bg-white/5' : 'border-white/80 bg-white/60'
        }`}
      >
        <Icon name="search" size={18} color={dark ? palette.dk.muted : palette.ink.muted} />
        <T className={`flex-1 text-15 ${sub}`}>Ask about your messages</T>
        <Icon name="arrowRight" size={18} color={dark ? palette.dk.accent : palette.navy.DEFAULT} />
      </Tap>
      <T className={`text-12 ${sub}`}>Everything stays on this phone and works offline.</T>
    </Glass>
  );
}

type Question = { ask: string; answer: string; on: boolean; icon: IconName; fg: string; bg: string; to: Board };

/** Three questions MIRA asks to learn how to help, each showing the current answer. */
export function GetToKnow({ channels, dark }: { channels: Channel[]; dark: boolean }) {
  const go = useGo();
  const { data: rules } = useRules();
  const on = (id: string) => rules?.some(rule => rule.id === id && rule.enabled) ?? false;
  const apps = channels.filter(channel => channel.enabled).map(channel => channel.label);
  const remind = on('builtin-remind');
  const alert = on('builtin-alert');
  const drafts = on('builtin-draft');

  const questions: Question[] = [
    {
      ask: 'Which messages should I keep for you?',
      answer:
        apps.length === 0
          ? 'No apps yet. Tap to choose.'
          : `From ${apps.slice(0, 2).join(', ')}${apps.length > 2 ? ` and ${apps.length - 2} more` : ''}`,
      on: apps.length > 0,
      icon: 'chat',
      fg: palette.mint.ink,
      bg: palette.mint.bg,
      to: 'ConnectedApps',
    },
    {
      ask: 'What should I remind you about?',
      answer:
        remind && alert
          ? 'Due dates and urgent messages'
          : remind
          ? 'Due dates and payments'
          : alert
          ? 'Urgent messages'
          : 'Nothing yet. Tap to choose.',
      on: remind || alert,
      icon: 'bell',
      fg: palette.warning.ink,
      bg: palette.warning.bg,
      to: 'Teach',
    },
    {
      ask: 'Should I help answer your messages and emails?',
      answer: drafts ? 'Yes, I write drafts. You check and send.' : 'Not yet. Tap to choose.',
      on: drafts,
      icon: 'pencil',
      fg: palette.navy.DEFAULT,
      bg: palette.peri.tonal,
      to: drafts ? 'Approvals' : 'Teach',
    },
  ];

  const ink = dark ? 'text-dk-text' : 'text-ink';
  const sub = dark ? 'text-dk-text3' : 'text-ink-2';
  return (
    <View className="gap-10">
      <View className="gap-2">
        <T accessibilityRole="header" className={`text-18 font-semibold ${ink}`}>
          Help me get to know you
        </T>
        <T className={`text-13 ${sub}`}>So I can help the way you like.</T>
      </View>
      <Glass kind={dark ? 'dark' : 'glass'} className="rounded-22 px-16 py-4">
        {questions.map((q, i) => (
          <Tap
            key={q.ask}
            label={q.ask}
            onPress={() => go(q.to)}
            className={`min-h-64 flex-row items-center gap-12 py-12 ${
              i < questions.length - 1 ? (dark ? 'border-b border-white/10' : 'border-b border-ink/8') : ''
            }`}
          >
            <IconTile name={q.icon} fg={q.fg} bg={q.bg} />
            <View className="flex-1 gap-2">
              <T className={`text-15 font-bold ${ink}`}>{q.ask}</T>
              <T className={`text-13 ${q.on ? (dark ? 'text-dk-success' : 'text-success-ink') : sub}`}>{q.answer}</T>
            </View>
            <Icon name="chevronRight" size={16} color={dark ? palette.dk.muted : palette.ink.muted} />
          </Tap>
        ))}
      </Glass>
    </View>
  );
}
