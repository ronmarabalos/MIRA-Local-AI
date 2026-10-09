/** Board 21-activity-history: everything MIRA did or proposed, with its status. */
import { Fragment, useState } from 'react';
import { View } from 'react-native';

import { D, Icon } from '../../components/Icon';
import { Spin } from '../../components/motion';
import { Screen } from '../../components/Screen';
import { T } from '../../components/T';
import { BackButton, FilterPills, Tap } from '../../components/ui';
import palette from '../../theme/palette';

type Status = 'suggested' | 'awaiting' | 'queued' | 'processing' | 'completed' | 'failed';
type Filter = 'all' | 'needs' | 'queued' | 'completed' | 'failed';

const LOOK: Record<Status, { label: string; fg: string; bg: string; dashed?: boolean; icon: string }> = {
  suggested: { label: 'Suggested', fg: palette.navy.DEFAULT, bg: palette.white, dashed: true, icon: D.plus },
  awaiting: { label: 'Awaiting approval', fg: palette.warning.ink, bg: palette.warning.bg, icon: D.shieldAlert },
  queued: { label: 'Queued', fg: palette.ink.label, bg: 'rgba(255,255,255,0.6)', icon: D.clock },
  processing: { label: 'Processing', fg: palette.navy.pressed, bg: palette.peri.tonal, icon: '' },
  completed: { label: 'Completed', fg: palette.success.ink, bg: palette.success.bg, icon: D.check },
  failed: { label: 'Failed', fg: palette.error.ink, bg: palette.error.bg, icon: D.x },
};

const ROWS: { id: string; day: string; title: string; time: string; s: Status; source: string; result: string; approval: string; app: string }[] = [
  { id: 'r1', day: 'TODAY', title: 'Summarizing Priya’s email', time: 'Now', s: 'processing', source: 'You asked', result: 'In progress on device', approval: 'No', app: 'Demo mailbox' },
  { id: 'r2', day: 'TODAY', title: 'Calendar refresh', time: '9:12 AM', s: 'failed', source: 'Scheduled sync', result: 'No connection · retry queued', approval: 'No', app: 'Demo calendar' },
  { id: 'r3', day: 'TODAY', title: 'Drafted reply to Jordan Lee', time: '8:50 AM', s: 'completed', source: 'Draft routine email replies', result: 'Draft saved · not sent', approval: 'No (drafts only)', app: 'Demo mailbox' },
  { id: 'r4', day: 'TODAY', title: 'Send reply to Maya Chen', time: '8:44 AM', s: 'awaiting', source: 'Draft routine email replies', result: 'Waiting for you', approval: 'Yes', app: 'Demo mailbox' },
  { id: 'r5', day: 'TODAY', title: 'Created reminder: Submit Q3 report', time: '8:31 AM', s: 'completed', source: 'You confirmed in chat', result: 'Reminder set for Sat 8:00 AM', approval: 'Yes · you confirmed', app: 'This device' },
  { id: 'r6', day: 'TODAY', title: 'Proposed “Sunday week planning”', time: '7:31 AM', s: 'suggested', source: 'Noticed a routine', result: 'Not active', approval: 'Yes', app: 'This device' },
  { id: 'r7', day: 'TODAY', title: 'Prepared today’s plan', time: '7:30 AM', s: 'completed', source: 'Daily morning planning', result: '3 tasks, 2 events', approval: 'No', app: 'This device' },
  { id: 'r8', day: 'YESTERDAY', title: 'Send reply to Sam Rivera', time: '9:10 PM', s: 'queued', source: 'You approved offline', result: 'Waits for connection', approval: 'Yes · re-confirm online', app: 'Demo mailbox' },
];

const RANGES = ['Today & yesterday', 'Today', 'This week'];

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-10">
      <T className="text-13 text-ink-2">{label}</T>
      <T className="shrink text-right text-13 font-bold">{value}</T>
    </View>
  );
}

export default function ActivityScreen() {
  const [filter, setFilter] = useState<Filter>('all');
  const [range, setRange] = useState(0);
  const [open, setOpen] = useState<string | null>('r3');

  const visible = ROWS.filter(
    (r) =>
      (filter === 'all' || (filter === 'needs' ? r.s === 'awaiting' || r.s === 'suggested' : r.s === filter)) &&
      (range !== 1 || r.day === 'TODAY'),
  );

  return (
    <Screen>
      <View className="flex-row items-center justify-between">
        <BackButton to="Profile" />
        <Tap
          label={RANGES[range]}
          onPress={() => setRange((range + 1) % RANGES.length)}
          className="h-40 flex-row items-center gap-6 rounded-12 border border-white/80 bg-white/60 px-12"
        >
          <Icon name="calendar" size={15} color={palette.navy.DEFAULT} />
          <T className="text-13 font-bold">{RANGES[range]}</T>
        </Tap>
      </View>
      <T accessibilityRole="header" className="text-30 font-medium tracking-[-0.9px]">Activity</T>
      <FilterPills<Filter>
        label="Status filter"
        value={filter}
        onChange={setFilter}
        items={[
          { id: 'all', label: 'All' },
          { id: 'needs', label: 'Needs you' },
          { id: 'queued', label: 'Queued' },
          { id: 'completed', label: 'Completed' },
          { id: 'failed', label: 'Failed' },
        ]}
      />

      <View>
        {visible.map((r, i) => {
          const look = LOOK[r.s];
          const isOpen = open === r.id;
          return (
            <Fragment key={r.id}>
              {i === 0 || visible[i - 1].day !== r.day ? (
                <T className="py-10 pl-2 text-12 font-bold tracking-[0.72px] text-ink-label">{r.day}</T>
              ) : null}
              <View className="flex-row gap-12">
                <View className="w-34 shrink-0 items-center">
                  <View
                    className={`h-34 w-34 items-center justify-center rounded-12 ${look.dashed ? 'border-[1.5px] border-dashed border-peri-400' : ''}`}
                    style={{ backgroundColor: look.bg }}
                  >
                    {r.s === 'processing' ? (
                      <Spin>
                        <View className="h-14 w-14 rounded-full border-2 border-peri-200" style={{ borderTopColor: palette.navy.DEFAULT }} />
                      </Spin>
                    ) : (
                      <Icon d={look.icon} size={16} strokeWidth={2.4} color={look.fg} />
                    )}
                  </View>
                  <View className="min-h-12 w-2 flex-1 bg-peri-150" />
                </View>
                <View className="min-w-0 flex-1 pb-12">
                  <Tap
                    label={r.title}
                    accessibilityState={{ expanded: isOpen }}
                    onPress={() => setOpen(isOpen ? null : r.id)}
                    glass="glass2"
                    className="w-full gap-6 rounded-18 px-14 py-12"
                  >
                    <View className="flex-row items-start justify-between gap-8">
                      <T className="flex-1 text-14 font-bold leading-[18.9px]">{r.title}</T>
                      <T className="text-12 text-ink-muted">{r.time}</T>
                    </View>
                    <View className="flex-row flex-wrap items-center gap-6">
                      <View className="rounded-full px-8 py-3" style={{ backgroundColor: look.bg }}>
                        <T className="text-11 font-bold" style={{ color: look.fg }}>
                          {look.label}
                        </T>
                      </View>
                      <T className="text-12 text-ink-2">{r.source}</T>
                    </View>
                    {isOpen ? (
                      <View className="mt-4 gap-6 border-t border-ink/8 pt-10">
                        <Detail label="Result" value={r.result} />
                        <Detail label="Approval required" value={r.approval} />
                        <Detail label="App" value={r.app} />
                      </View>
                    ) : null}
                  </Tap>
                </View>
              </View>
            </Fragment>
          );
        })}
        {visible.length === 0 ? (
          <View className="rounded-20 border-[1.5px] border-dashed border-peri-200 p-24">
            <T className="text-center text-14 text-ink-2">No activity matches this filter.</T>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
