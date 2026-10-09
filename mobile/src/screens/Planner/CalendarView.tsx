/** Board 17-calendar: October 2026, month or week, and the day's agenda. */
import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { Icon } from '../../components/Icon';
import { useGo } from '../../components/nav';
import { Screen } from '../../components/Screen';
import { T } from '../../components/T';
import { Glass, Tap } from '../../components/ui';
import palette from '../../theme/palette';

type Kind = 'event' | 'reminder' | 'auto';
type Source = 'synced' | 'local' | 'auto';
type Entry = { id: string; time: string; title: string; type: Kind; src: Source; note: string };

const COLOR: Record<Kind, string> = { event: palette.peri[600], reminder: palette.mint.DEFAULT, auto: palette.warning.DEFAULT };
const SOURCE: Record<Source, [string, string, string]> = {
  synced: ['Synced · demo calendar', palette.navy.pressed, palette.peri.tonal],
  local: ['On this device', palette.mint.ink, palette.mint.bg],
  auto: ['Automation', palette.warning.ink, palette.warning.bg],
};

const EVENTS: Record<number, Entry[]> = {
  9: [
    { id: 'e1', time: '9:30 AM', title: 'Team stand-up', type: 'event', src: 'synced', note: 'Daily 15-minute check-in. Last synced 8:45 AM.' },
    { id: 'e2', time: '2:00 PM', title: '1:1 with Priya', type: 'event', src: 'synced', note: 'Bring the Q3 revenue table she sent this morning.' },
    { id: 'e3', time: '8:00 PM', title: 'Call Mom', type: 'reminder', src: 'local', note: 'Reminder you created on this device.' },
  ],
  10: [
    { id: 'e4', time: '9:00 AM', title: 'Submit Q3 report', type: 'reminder', src: 'local', note: 'Reminder at 8:00 AM, created with MIRA this morning.' },
    { id: 'e5', time: '10:00 AM', title: 'Design review', type: 'event', src: 'synced', note: 'MIRA suggested moving this to 11:00 AM. The change is waiting in your approvals.' },
    { id: 'e6', time: '7:30 PM', title: 'Dinner with Sam', type: 'event', src: 'local', note: 'Thai place on Elm. Your reply to Sam is queued until you’re online.' },
  ],
  11: [{ id: 'e7', time: '7:00 PM', title: 'Plan the week', type: 'auto', src: 'auto', note: 'Weekly reminder. MIRA suggested turning this into an automation.' }],
  12: [{ id: 'e8', time: '7:30 AM', title: 'Daily morning planning', type: 'auto', src: 'auto', note: 'Runs on device every morning.' }],
  14: [{ id: 'e9', time: '3:00 PM', title: 'Dentist', type: 'event', src: 'local', note: 'Booked yesterday.' }],
  20: [{ id: 'e10', time: 'All day', title: 'Electricity bill due', type: 'reminder', src: 'local', note: 'Created from the City Utilities email.' }],
};

const TODAY = 9;
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Monday-first grid; 1 October 2026 is a Thursday.
const CELLS = Array.from({ length: 35 }, (_, i) => {
  const n = i - 3;
  const inMonth = n >= 1 && n <= 31;
  return { n: inMonth ? n : n < 1 ? 30 + n : n - 31, day: inMonth ? n : null, row: Math.floor(i / 7) };
});

function Legend({ label, shape }: { label: string; shape: ReactNode }) {
  return (
    <View className="flex-row items-center gap-5">
      {shape}
      <T className="text-11 font-bold text-ink-label">{label}</T>
    </View>
  );
}

export function CalendarView({ header }: { header: ReactNode }) {
  const go = useGo();
  const [sel, setSel] = useState(10);
  const [view, setView] = useState<'month' | 'week'>('month');
  const [open, setOpen] = useState<string | null>('e5');

  const selRow = CELLS.find((c) => c.day === sel)!.row;
  const rows = [0, 1, 2, 3, 4].filter((r) => view === 'month' || r === selRow);
  const list = EVENTS[sel] ?? [];
  const title = `${sel === TODAY ? 'Today · ' : sel === TODAY + 1 ? 'Tomorrow · ' : ''}${DAY_NAMES[(sel + 2) % 7]} ${sel} Oct`;

  return (
    <Screen tab="Planner">
      {header}
      <Glass className="gap-12 rounded-24 p-14">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Tap label="Previous month" className="h-40 w-40 items-center justify-center rounded-12">
              <Icon name="chevronLeft" size={18} strokeWidth={2.2} />
            </Tap>
            <T className="text-17 font-bold">October 2026</T>
            <Tap label="Next month" className="h-40 w-40 items-center justify-center rounded-12">
              <Icon name="chevronRight" size={18} strokeWidth={2.2} />
            </Tap>
          </View>
          <View accessibilityRole="tablist" accessibilityLabel="View" className="flex-row rounded-12 bg-white/55 p-3">
            {(['month', 'week'] as const).map((id) => (
              <Tap
                key={id}
                label={id === 'month' ? 'Month' : 'Week'}
                accessibilityRole="tab"
                accessibilityState={{ selected: view === id }}
                onPress={() => setView(id)}
                className={`h-34 justify-center rounded-10 px-12 ${view === id ? 'bg-white' : ''}`}
              >
                <T className={`text-12 font-bold ${view === id ? 'text-ink' : 'text-ink-label'}`}>{id === 'month' ? 'Month' : 'Week'}</T>
              </Tap>
            ))}
          </View>
        </View>

        <View className="flex-row gap-2">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <T key={i} className="flex-1 text-center text-11 font-bold text-ink-muted">
              {d}
            </T>
          ))}
        </View>

        <View className="gap-2">
          {rows.map((r) => (
            <View key={r} className="flex-row gap-2">
              {CELLS.filter((c) => c.row === r).map((c, i) => {
                const isSel = c.day === sel;
                const isToday = c.day === TODAY;
                const types = c.day && EVENTS[c.day] ? Array.from(new Set(EVENTS[c.day].map((e) => e.type))) : [];
                return (
                  <Tap
                    key={i}
                    label={c.day ? `October ${c.day}${types.length ? ', has items' : ''}` : 'Outside this month'}
                    accessibilityState={{ selected: isSel }}
                    disabled={!c.day}
                    onPress={() => c.day && setSel(c.day)}
                    activeOpacity={0.6}
                    className={`h-46 flex-1 items-center justify-center gap-4 rounded-14 ${isSel ? 'bg-navy' : ''}`}
                    style={isToday && !isSel ? { boxShadow: `inset 0 0 0 1.5px ${palette.peri[600]}` } : undefined}
                  >
                    <T
                      className={`text-14 ${isToday || isSel ? 'font-bold' : 'font-semibold'} ${
                        isSel ? 'text-white' : c.day ? 'text-ink' : 'text-ink-outside'
                      }`}
                    >
                      {c.n}
                    </T>
                    <View className="h-5 flex-row gap-3">
                      {types.map((t) => (
                        <View key={t} className="h-5 w-5 rounded-full" style={{ backgroundColor: isSel ? palette.white : COLOR[t] }} />
                      ))}
                    </View>
                  </Tap>
                );
              })}
            </View>
          ))}
        </View>

        <View className="flex-row flex-wrap gap-14 px-4">
          <Legend label="Events" shape={<View className="h-8 w-8 rounded-full" style={{ backgroundColor: COLOR.event }} />} />
          <Legend label="Reminders" shape={<View className="h-8 w-8 rounded-2" style={{ backgroundColor: COLOR.reminder }} />} />
          <Legend
            label="Automations"
            shape={<View className="h-8 w-8 rounded-2" style={{ backgroundColor: COLOR.auto, transform: [{ rotate: '45deg' }] }} />}
          />
        </View>
      </Glass>

      <View className="gap-10">
        <View className="flex-row items-baseline justify-between">
          <T accessibilityRole="header" className="text-18 font-bold">{title}</T>
          <T className="text-12 text-ink-muted">{list.length ? `${list.length} ${list.length === 1 ? 'item' : 'items'}` : ''}</T>
        </View>
        {list.map((e) => {
          const isOpen = open === e.id;
          const [src, srcFg, srcBg] = SOURCE[e.src];
          return (
            <Glass key={e.id} className="overflow-hidden rounded-20">
              <Tap
                label={`${e.time}, ${e.title}`}
                accessibilityState={{ expanded: isOpen }}
                onPress={() => setOpen(isOpen ? null : e.id)}
                className="flex-row items-center gap-12 p-14"
              >
                <View className="w-4 self-stretch rounded-4" style={{ backgroundColor: COLOR[e.type] }} />
                <T className="w-64 shrink-0 text-13 font-bold text-ink-body">{e.time}</T>
                <View className="min-w-0 flex-1 gap-4">
                  <T className="text-15 font-bold">{e.title}</T>
                  <View className="self-start rounded-full px-8 py-3" style={{ backgroundColor: srcBg }}>
                    <T className="text-11 font-bold" style={{ color: srcFg }}>
                      {src}
                    </T>
                  </View>
                </View>
              </Tap>
              {isOpen ? (
                <View className="gap-10 border-t border-ink/8 px-14 pb-14 pt-12">
                  <T className="text-13 leading-[19.5px] text-ink-body">{e.note}</T>
                  <View className="flex-row gap-6">
                    <Tap label="Edit" className="h-40 flex-1 items-center justify-center rounded-12 border border-white/80 bg-white/60">
                      <T className="text-13 font-bold">Edit</T>
                    </Tap>
                    <Tap label="Remind me" onPress={() => go('Tasks')} className="h-40 flex-1 items-center justify-center rounded-12 border border-white/80">
                      <T className="text-13 font-bold">Remind me</T>
                    </Tap>
                    <Tap label="Ask MIRA" onPress={() => go('Assistant')} className="h-40 flex-1 items-center justify-center rounded-12 bg-peri-tonal">
                      <T className="text-13 font-bold text-navy-pressed">Ask MIRA</T>
                    </Tap>
                  </View>
                </View>
              ) : null}
            </Glass>
          );
        })}
        {list.length === 0 ? (
          <View className="rounded-20 border-[1.5px] border-dashed border-peri-200 p-24">
            <T className="text-center text-14 text-ink-2">Nothing planned. Ask MIRA to suggest focus time.</T>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
