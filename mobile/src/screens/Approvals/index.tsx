/** Board 15-approval-center. */
import { useState } from 'react';
import { View } from 'react-native';

import { D } from '../../components/Icon';
import { useGo, type Board } from '../../components/nav';
import { Screen } from '../../components/Screen';
import { T } from '../../components/T';
import { BackButton, CheckBox, Chip, IconTile, Tap } from '../../components/ui';
import palette from '../../theme/palette';

type Decision = 'approved' | 'rejected';

const ITEMS = [
  { id: 'p1', kind: 'EMAIL REPLY', title: 'Send your reply to Maya Chen', app: 'Demo mailbox', why: 'Drafted by “Draft routine email replies” for her meeting request.', change: 'Sends 1 email to maya@northwind.example', perm: 'Send email', net: true, low: false, edit: 'EmailDetail' as Board, icon: D.mail, fg: palette.navy.DEFAULT, bg: palette.peri.tonal },
  { id: 'p2', kind: 'PROPOSED AUTOMATION', title: 'Sunday week planning', app: 'On this device', why: 'You planned your week by hand three Sundays in a row.', change: 'New automation · reminders only', perm: 'Create reminders', net: false, low: true, edit: 'AutomationBuilder' as Board, icon: D.bolt, fg: palette.mint.ink, bg: palette.mint.bg },
  { id: 'p3', kind: 'CALENDAR UPDATE', title: 'Move “Design review” to 11:00 AM', app: 'Demo calendar', why: 'It overlaps the focus block you asked for before the Q3 report deadline.', change: 'Tomorrow 10:00 → 11:00 AM', perm: 'Modify events', net: true, low: false, edit: 'Calendar' as Board, icon: D.calendar, fg: palette.warning.ink, bg: palette.warning.bg },
  { id: 'p4', kind: 'SCHEDULED ONLINE ACTION', title: 'Refresh calendars when you reconnect', app: 'Demo calendar', why: 'Your calendar hasn’t synced since 8:45 AM.', change: 'Downloads new events, changes nothing', perm: 'Read events', net: true, low: true, edit: 'OfflineSync' as Board, icon: D.refresh, fg: palette.ink.label, bg: 'rgba(255,255,255,0.6)' },
];

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-12">
      <T className="text-13 text-ink-2">{label}</T>
      <T className="shrink text-right text-13 font-bold">{value}</T>
    </View>
  );
}

export default function ApprovalsScreen() {
  const go = useGo();
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [open, setOpen] = useState<Record<string, boolean>>({ p1: true });

  const decide = (ids: string[], value: Decision) => {
    setDecisions({ ...decisions, ...Object.fromEntries(ids.map((id) => [id, value])) });
    setPicked({});
  };
  const pending = ITEMS.filter((d) => !decisions[d.id]).length;
  const pickedIds = Object.keys(picked).filter((k) => picked[k] && !decisions[k]);

  return (
    <Screen gap={18}>
      <View className="flex-row items-center justify-between">
        <BackButton to="Home" label="Back to Home" />
        <Tap label="Activity history" onPress={() => go('Activity')} className="px-4 py-12">
          <T className="text-14 font-bold text-navy">Activity history</T>
        </Tap>
      </View>
      <View className="gap-4">
        <T accessibilityRole="header" className="text-30 font-medium tracking-[-0.9px]">Needs Your Approval</T>
        <T className="text-15 text-ink-2">{pending ? `${pending} waiting for you` : 'All caught up'}</T>
      </View>

      {pickedIds.length > 0 ? (
        <View className="flex-row items-center gap-10 rounded-16 bg-ink py-10 pl-14 pr-10">
          <T className="flex-1 text-13 font-semibold text-white">{`${pickedIds.length} low-risk selected`}</T>
          <Tap label="Approve selected" onPress={() => decide(pickedIds, 'approved')} className="h-40 justify-center rounded-12 bg-white/60 px-14">
            <T className="text-13 font-bold">Approve selected</T>
          </Tap>
        </View>
      ) : null}

      <View className="gap-12">
        {ITEMS.map((d) => {
          const dec = decisions[d.id];
          const isOpen = !!open[d.id];
          const isPicked = !!picked[d.id];
          let status = { label: 'Awaiting approval', fg: palette.warning.ink, bg: palette.warning.bg, outcome: '' };
          if (dec === 'approved' && d.net) {
            status = { label: 'Approved · queued', fg: palette.ink.label, bg: 'rgba(255,255,255,0.6)', outcome: 'Runs when online' };
          } else if (dec === 'approved') {
            status = { label: 'Completed', fg: palette.success.ink, bg: palette.success.bg, outcome: 'Done' };
          } else if (dec === 'rejected') {
            status = { label: 'Rejected', fg: palette.error.ink, bg: palette.error.bg, outcome: 'Won’t happen' };
          }
          return (
            <View
              key={d.id}
              className={`gap-12 rounded-22 border bg-white/46 p-16 ${dec ? 'border-white/80' : 'border-warning-line'}`}
            >
              <View className="flex-row items-start gap-12">
                {d.low && !dec ? (
                  <Tap
                    label="Select for batch approval"
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isPicked }}
                    onPress={() => setPicked({ ...picked, [d.id]: !isPicked })}
                    className="-ml-10 -mr-6 -mt-6 h-44 w-44 items-center justify-center"
                  >
                    <CheckBox on={isPicked} />
                  </Tap>
                ) : null}
                <IconTile d={d.icon} size={40} radius={13} fg={d.fg} bg={d.bg} />
                <View className="min-w-0 flex-1 gap-4">
                  <T className="text-11 font-bold tracking-[0.66px] text-ink-label">{d.kind}</T>
                  <T className="text-15 font-bold leading-[20.25px]">{d.title}</T>
                </View>
              </View>
              <View className="flex-row flex-wrap items-center gap-6">
                <Chip label={status.label} fg={status.fg} bg={status.bg} />
                <Chip
                  label={d.low ? 'Low risk' : 'Review carefully'}
                  fg={d.low ? palette.mint.ink : palette.error.ink}
                  bg={d.low ? palette.mint.bg : palette.error.bg}
                />
                <T className="text-12 text-ink-muted">{d.app}</T>
              </View>
              <T className="text-13 leading-[19.5px] text-ink-body">
                <T className="text-13 font-bold">Why: </T>
                {d.why}
              </T>
              {isOpen ? (
                <View className="gap-8 rounded-14 bg-white/50 p-12">
                  <Detail label="Proposed change" value={d.change} />
                  <Detail label="Permission needed" value={d.perm} />
                  <Detail label="Needs internet" value={d.net ? 'Yes' : 'No'} />
                </View>
              ) : null}
              {dec ? (
                <View className="flex-row items-center justify-between gap-10">
                  <T className="text-13 text-ink-body">{status.outcome}</T>
                  <Tap
                    label="Undo"
                    onPress={() => {
                      const next = { ...decisions };
                      delete next[d.id];
                      setDecisions(next);
                    }}
                    className="h-40 justify-center rounded-12 border border-white/80 bg-white/60 px-12"
                  >
                    <T className="text-13 font-bold">Undo</T>
                  </Tap>
                </View>
              ) : (
                <View className="flex-row gap-6">
                  <Tap label="Approve" onPress={() => decide([d.id], 'approved')} className="h-42 flex-[1.2] items-center justify-center rounded-12 bg-navy">
                    <T className="text-13 font-bold text-white">Approve</T>
                  </Tap>
                  <Tap
                    label={isOpen ? 'Hide' : 'Details'}
                    accessibilityState={{ expanded: isOpen }}
                    onPress={() => setOpen({ ...open, [d.id]: !isOpen })}
                    className="h-42 flex-1 items-center justify-center rounded-12 border border-white/80 bg-white/60"
                  >
                    <T className="text-13 font-bold">{isOpen ? 'Hide' : 'Details'}</T>
                  </Tap>
                  <Tap label="Edit" onPress={() => go(d.edit)} className="h-42 flex-[0.8] items-center justify-center rounded-12 border border-white/80">
                    <T className="text-13 font-bold">Edit</T>
                  </Tap>
                  <Tap
                    label="Reject"
                    onPress={() => decide([d.id], 'rejected')}
                    className="h-42 flex-[0.9] items-center justify-center rounded-12 border border-error-line bg-white/60"
                  >
                    <T className="text-13 font-bold text-error-ink">Reject</T>
                  </Tap>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </Screen>
  );
}
