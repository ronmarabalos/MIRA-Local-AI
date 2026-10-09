/** Board 16-tasks-and-reminders. */
import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { Icon } from '../../components/Icon';
import { useGo } from '../../components/nav';
import { Sheet } from '../../components/Overlay';
import { Screen } from '../../components/Screen';
import { T } from '../../components/T';
import { useTabBarBottom } from '../../components/TabBar';
import { CheckBox, ChoicePill, Field, Glass, IconTile, SecondaryButton, Switch, Tap } from '../../components/ui';
import { fx } from '../../theme/effects';
import palette from '../../theme/palette';

type When = 'today' | 'upcoming';
type Tab = When | 'completed' | 'all';
type Priority = 'high' | 'med' | 'low';

type Task = {
  id: string;
  title: string;
  due: string;
  when: When;
  cat: string;
  p: Priority;
  reminder: boolean;
  repeat?: boolean;
  done: boolean;
};

const START: Task[] = [
  { id: 't3', title: 'Reply to Sam about dinner', due: 'Today 6:00 PM', when: 'today', cat: 'Personal', p: 'med', reminder: true, done: false },
  { id: 't4', title: 'Pay electricity bill', due: 'Today', when: 'today', cat: 'Home · from email', p: 'med', reminder: false, done: false },
  { id: 't5', title: 'Call Mom', due: 'Today 8:00 PM', when: 'today', cat: 'Personal', p: 'low', reminder: true, done: false },
  { id: 't1', title: 'Submit Q3 report', due: 'Tomorrow 9:00 AM', when: 'upcoming', cat: 'Work', p: 'high', reminder: true, done: false },
  { id: 't2', title: 'Prep design review slides', due: 'Tomorrow 10:00 AM', when: 'upcoming', cat: 'Work', p: 'high', reminder: false, done: false },
  { id: 't6', title: 'Plan the week', due: 'Sun 7:00 PM', when: 'upcoming', cat: 'Routine', p: 'low', reminder: true, repeat: true, done: false },
  { id: 't7', title: 'Book dentist appointment', due: 'Done yesterday', when: 'today', cat: 'Personal', p: 'low', reminder: false, done: true },
];

const PRIORITY: Record<Priority, [string, string, string]> = {
  high: ['High', palette.error.DEFAULT, palette.error.ink],
  med: ['Medium', palette.warning.DEFAULT, palette.warning.ink],
  low: ['Low', palette.peri[400], palette.navy.DEFAULT],
};

const TABS: [Tab, string][] = [
  ['today', 'Today'],
  ['upcoming', 'Upcoming'],
  ['completed', 'Done'],
  ['all', 'All'],
];

const WHENS = ['Today', 'Tomorrow', 'Next week'];

export function TasksView({ header }: { header: ReactNode }) {
  const go = useGo();
  const tabBottom = useTabBarBottom();
  const [tab, setTab] = useState<Tab>('today');
  const [tasks, setTasks] = useState(START);
  const [sheet, setSheet] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [when, setWhen] = useState(0);
  const [rem, setRem] = useState(true);

  const shown = tasks.filter((t) => (tab === 'completed' ? t.done : tab === 'all' ? true : !t.done && t.when === tab));

  const addTask = () => {
    const title = newTitle.trim();
    if (!title) {
      return;
    }
    const t: Task = {
      id: `n${Date.now()}`, title, due: WHENS[when], when: when === 0 ? 'today' : 'upcoming',
      cat: 'Personal', p: 'med', reminder: rem, done: false,
    };
    setTasks([t, ...tasks]);
    setSheet(false);
    setNewTitle('');
    setTab(t.when);
  };

  const fab = (
    <>
      <Tap
        label="Add task"
        onPress={() => setSheet(true)}
        className="absolute right-24 h-60 w-60 items-center justify-center rounded-20"
        style={[fx.primary, fx.fab, { bottom: tabBottom + 94 }]}
      >
        <Icon name="plus" size={26} strokeWidth={2.4} color={palette.white} />
      </Tap>
      <Sheet visible={sheet} onClose={() => setSheet(false)} label="New task">
        <T className="text-20 font-bold">New task</T>
        <View className="gap-6">
          <T className="text-13 font-bold">Task</T>
          <Field
            accessibilityLabel="Task"
            value={newTitle}
            onChangeText={setNewTitle}
            placeholder="e.g. Send invoice to Priya"
            onSubmitEditing={addTask}
            className="h-52 rounded-16 border-[1.5px] border-peri-300 bg-white px-14 text-16"
          />
        </View>
        <View className="gap-8">
          <T className="text-13 font-bold">When</T>
          <View className="flex-row flex-wrap gap-8">
            {WHENS.map((label, i) => (
              <ChoicePill key={label} label={label} selected={i === when} onPress={() => setWhen(i)} className="h-40 rounded-12 px-14" />
            ))}
          </View>
        </View>
        <Tap
          label="Remind me"
          accessibilityRole="switch"
          accessibilityState={{ checked: rem }}
          onPress={() => setRem(!rem)}
          className="min-h-52 flex-row items-center gap-12 rounded-16 border border-white/80 bg-white/60 pl-14 pr-12"
        >
          <T className="flex-1 text-14 font-bold">Remind me</T>
          <Switch on={rem} />
        </Tap>
        <View className="flex-row gap-8">
          <SecondaryButton label="Cancel" onPress={() => setSheet(false)} height={54} className="flex-1" />
          <Tap label="Save task" onPress={addTask} className="h-54 flex-[2] items-center justify-center rounded-18" style={fx.primary}>
            <T className="text-15 font-bold text-white">Save task</T>
          </Tap>
        </View>
      </Sheet>
    </>
  );

  return (
    <Screen tab="Planner" overlay={fab}>
      {header}
      <View accessibilityRole="tablist" accessibilityLabel="Task views" className="flex-row gap-6">
        {TABS.map(([id, label]) => {
          const sel = tab === id;
          return (
            <Tap
              key={id}
              label={label}
              accessibilityRole="tab"
              accessibilityState={{ selected: sel }}
              onPress={() => setTab(id)}
              className={`h-40 flex-1 items-center justify-center rounded-12 border ${sel ? 'border-ink bg-ink' : 'border-white/80 bg-white'}`}
            >
              <T className={`text-13 font-bold ${sel ? 'text-white' : 'text-ink'}`}>{label}</T>
            </Tap>
          );
        })}
      </View>

      <View className="gap-10">
        {shown.map((t) => {
          const [pLabel, pColor, pText] = PRIORITY[t.p];
          return (
            <Glass key={t.id} className="relative flex-row items-center gap-6 overflow-hidden rounded-20 py-12 pl-6 pr-12">
              <View
                accessibilityElementsHidden
                className="absolute bottom-14 left-0 top-14 w-4 rounded-r-4"
                style={{ backgroundColor: pColor }}
              />
              <Tap
                label={`Complete ${t.title}`}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: t.done }}
                onPress={() => setTasks(tasks.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))}
                className="h-44 w-44 items-center justify-center"
              >
                <CheckBox on={t.done} size={24} round onColor={palette.success.DEFAULT} />
              </Tap>
              <View className="min-w-0 flex-1 gap-4">
                <T className={`text-15 font-bold ${t.done ? 'text-ink-muted line-through' : 'text-ink'}`}>{t.title}</T>
                <View className="flex-row flex-wrap items-center gap-8">
                  <T className={`text-12 font-bold ${t.due.startsWith('Today') ? 'text-navy' : 'text-ink-body'}`}>{t.due}</T>
                  <T className="text-12 text-ink-2">·</T>
                  <T className="text-12 text-ink-2">{t.cat}</T>
                  <T className="text-12 font-bold" style={{ color: pText }}>
                    {pLabel}
                  </T>
                </View>
              </View>
              {t.reminder ? (
                <View accessibilityLabel="Reminder set">
                  <IconTile name="bell" size={32} radius={10} iconSize={16} fg={palette.navy.DEFAULT} bg="rgba(255,255,255,0.55)" />
                </View>
              ) : null}
              {t.repeat ? (
                <View accessibilityLabel="Repeats weekly">
                  <IconTile name="repeat" size={32} radius={10} iconSize={16} fg={palette.mint.ink} bg={palette.mint.bg} />
                </View>
              ) : null}
              {t.done ? (
                <Tap
                  label={`Delete ${t.title}`}
                  onPress={() => setTasks(tasks.filter((x) => x.id !== t.id))}
                  className="h-40 w-40 items-center justify-center rounded-12"
                >
                  <Icon name="trash" size={18} color={palette.error.ink} />
                </Tap>
              ) : null}
            </Glass>
          );
        })}
        {shown.length === 0 ? (
          <View className="rounded-20 border-[1.5px] border-dashed border-peri-200 p-28">
            <T className="text-center text-14 text-ink-2">Nothing here. Enjoy the space.</T>
          </View>
        ) : null}
      </View>

      <Tap label="Reminder alerts, 10 min before" onPress={() => go('Settings')} glass="glass2" className="flex-row items-center gap-12 rounded-18 px-14 py-12">
        <IconTile name="bell" size={36} radius={12} iconSize={18} fg={palette.warning.ink} bg={palette.warning.bg} />
        <View className="flex-1 gap-2">
          <T className="text-14 font-bold">Reminder alerts</T>
          <T className="text-12 text-ink-muted">10 min before</T>
        </View>
        <Icon name="chevronRight" size={18} color={palette.ink.muted} />
      </Tap>
    </Screen>
  );
}
