/** Board 12-my-automations. */
import { useState } from 'react';
import { View } from 'react-native';

import { D, Icon } from '../../components/Icon';
import { useGo } from '../../components/nav';
import { Screen } from '../../components/Screen';
import { T } from '../../components/T';
import { useTabBarBottom } from '../../components/TabBar';
import { BackButton, Chip, FilterPills, Glass, IconTile, SearchField, Switch, Tap } from '../../components/ui';
import { fx } from '../../theme/effects';
import palette from '../../theme/palette';

type Filter = 'all' | 'active' | 'paused';
type Run = { text: string; time: string; ok: boolean };

const START = [
  { id: 'a1', name: 'Draft routine email replies', desc: 'When a routine meeting request arrives, prepare a reply draft.', on: true, last: 'Last ran 8:50 AM', runs: 14, icon: D.mail, fg: palette.navy.DEFAULT, bg: palette.peri.tonal },
  { id: 'a2', name: 'Daily morning planning', desc: 'Every day at 7:30 AM, prepare today’s plan.', on: true, last: 'Today 7:30 AM', runs: 32, icon: D.sun, fg: palette.warning.ink, bg: palette.warning.bg },
  { id: 'a3', name: 'Weekly task review', desc: 'Sundays at 6 PM, list unfinished tasks for review.', on: false, last: 'Last ran Sun 4 Oct', runs: 5, icon: D.calendar, fg: palette.mint.ink, bg: palette.mint.bg },
  { id: 'a4', name: 'Deadline reminder', desc: 'One day before a task is due, remind me.', on: true, last: 'Yesterday 9:00 AM', runs: 9, icon: D.clock, fg: palette.error.ink, bg: palette.error.bg },
];

const HISTORY: Record<string, Run[]> = {
  a1: [
    { text: 'Drafted reply to Jordan Lee', time: '8:50 AM', ok: true },
    { text: 'Drafted reply to Sam Rivera', time: 'Yesterday', ok: true },
    { text: 'Couldn’t read email: offline', time: 'Tue', ok: false },
  ],
  a2: [
    { text: 'Prepared today’s plan', time: '7:30 AM', ok: true },
    { text: 'Prepared plan', time: 'Yesterday', ok: true },
  ],
  a3: [{ text: 'Listed 4 open tasks', time: 'Sun 4 Oct', ok: true }],
  a4: [{ text: 'Reminded: Pay electricity bill', time: 'Yesterday', ok: true }],
};

export default function AutomationsScreen() {
  const go = useGo();
  const tabBottom = useTabBarBottom();
  const [list, setList] = useState(START);
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string | null>('a1');
  const [confirm, setConfirm] = useState<string | null>(null);

  const visible = list.filter(
    (a) =>
      (filter === 'all' || (filter === 'active' ? a.on : !a.on)) && a.name.toLowerCase().includes(q.toLowerCase()),
  );
  const activeN = list.filter((a) => a.on).length;

  const fab = (
    <Tap
      label="Create automation"
      onPress={() => go('AutomationBuilder')}
      className="absolute right-24 h-60 w-60 items-center justify-center rounded-20"
      style={[fx.primary, fx.fab, { bottom: tabBottom + 94 }]}
    >
      <Icon name="plus" size={26} strokeWidth={2.4} color={palette.white} />
    </Tap>
  );

  return (
    <Screen tab="Teach" overlay={fab}>
      <View className="flex-row items-center gap-12">
        <BackButton to="Teach" label="Back to Teach MIRA" />
      </View>
      <View className="gap-4">
        <T accessibilityRole="header" className="text-30 font-medium tracking-[-0.9px]">My automations</T>
        <T className="text-15 text-ink-2">{`${activeN} active · ${list.length - activeN} paused`}</T>
      </View>
      <SearchField label="Search automations" placeholder="Search automations" value={q} onChangeText={setQ} />
      <FilterPills<Filter>
        label="Filter"
        scroll={false}
        value={filter}
        onChange={setFilter}
        items={[
          { id: 'all', label: 'All' },
          { id: 'active', label: 'Active' },
          { id: 'paused', label: 'Paused' },
        ]}
      />
      <View className="gap-10">
        {visible.map((a) => {
          const isOpen = open === a.id;
          return (
            <Glass key={a.id} className={`gap-12 rounded-22 p-16 ${a.on ? '' : 'opacity-85'}`}>
              <View className="flex-row items-start gap-12">
                <IconTile d={a.icon} size={42} radius={14} fg={a.fg} bg={a.bg} />
                <Tap
                  label={a.name}
                  accessibilityState={{ expanded: isOpen }}
                  onPress={() => {
                    setOpen(isOpen ? null : a.id);
                    setConfirm(null);
                  }}
                  className="min-w-0 flex-1 gap-3"
                >
                  <T className="text-15 font-bold">{a.name}</T>
                  <T className="text-13 leading-[18.2px] text-ink-2">{a.desc}</T>
                </Tap>
                <Switch
                  on={a.on}
                  label={`Active: ${a.name}`}
                  onPress={() => setList(list.map((x) => (x.id === a.id ? { ...x, on: !x.on } : x)))}
                />
              </View>
              <View className="flex-row flex-wrap items-center gap-8 pl-54">
                <Chip
                  dot
                  label={a.on ? 'Active' : 'Paused'}
                  fg={a.on ? palette.success.ink : palette.ink.label}
                  bg={a.on ? palette.success.bg : 'rgba(255,255,255,0.6)'}
                />
                <T className="text-12 text-ink-muted">{`${a.last} · ${a.runs} runs`}</T>
              </View>
              {isOpen ? (
                <View className="gap-10 border-t border-ink/8 pt-12">
                  <T className="text-12 font-bold tracking-[0.72px] text-ink-label">RECENT RUNS</T>
                  {HISTORY[a.id].map((h) => (
                    <View key={h.text} className="flex-row items-center gap-10">
                      <IconTile
                        name={h.ok ? 'check' : 'x'} size={24} radius={8} iconSize={13} strokeWidth={2.8}
                        fg={h.ok ? palette.success.ink : palette.error.ink} bg={h.ok ? palette.success.bg : palette.error.bg}
                      />
                      <T className="min-w-0 flex-1 text-13 font-semibold">{h.text}</T>
                      <T className="text-12 text-ink-muted">{h.time}</T>
                    </View>
                  ))}
                  {confirm === a.id ? (
                    <View className="gap-10 rounded-14 bg-error-bg p-12">
                      <T className="text-13 font-bold text-error-deep">{`Delete “${a.name}”? Its history is kept in Activity.`}</T>
                      <View className="flex-row gap-8">
                        <Tap
                          label="Delete"
                          onPress={() => {
                            setList(list.filter((x) => x.id !== a.id));
                            setConfirm(null);
                          }}
                          className="h-40 flex-1 items-center justify-center rounded-12 bg-error-ink"
                        >
                          <T className="text-13 font-bold text-white">Delete</T>
                        </Tap>
                        <Tap label="Keep" onPress={() => setConfirm(null)} className="h-40 flex-1 items-center justify-center rounded-12 border border-white/80 bg-white/60">
                          <T className="text-13 font-bold">Keep</T>
                        </Tap>
                      </View>
                    </View>
                  ) : (
                    <View className="mt-4 flex-row gap-8">
                      <Tap label="Edit" onPress={() => go('AutomationBuilder')} className="h-42 flex-1 flex-row items-center justify-center gap-6 rounded-12 bg-white/55">
                        <Icon name="pencil" size={14} strokeWidth={2.2} color={palette.navy.DEFAULT} />
                        <T className="text-13 font-bold">Edit</T>
                      </Tap>
                      <Tap
                        label="Delete"
                        onPress={() => setConfirm(a.id)}
                        className="h-42 flex-1 flex-row items-center justify-center gap-6 rounded-12 border border-error-line bg-white/60"
                      >
                        <Icon name="trash" size={14} strokeWidth={2.2} color={palette.error.ink} />
                        <T className="text-13 font-bold text-error-ink">Delete</T>
                      </Tap>
                    </View>
                  )}
                </View>
              ) : null}
            </Glass>
          );
        })}
      </View>
    </Screen>
  );
}
