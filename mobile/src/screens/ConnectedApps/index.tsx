/** Board 19-connected-apps: sources MIRA can read, with per-app permissions. */
import { Fragment, useState } from 'react';
import { View } from 'react-native';

import { D, Icon } from '../../components/Icon';
import { Sheet } from '../../components/Overlay';
import { Screen } from '../../components/Screen';
import { T } from '../../components/T';
import { BackButton, Chip, SecondaryButton, Switch, Tap } from '../../components/ui';
import { fx } from '../../theme/effects';
import palette from '../../theme/palette';

type Status = 'connected' | 'none' | 'reauth' | 'offline';

const STATUS: Record<Status, [string, string, string, string]> = {
  connected: ['Connected', palette.success.ink, palette.success.bg, D.check],
  none: ['Not connected', palette.ink.label, 'rgba(255,255,255,0.6)', D.plus],
  reauth: ['Needs reauthorization', palette.warning.ink, palette.warning.bg, 'M12 8v5M12 16h.01'],
  offline: ['Offline · sync unavailable', palette.ink.label, 'rgba(255,255,255,0.6)', D.wifiOffShort],
};

const APPS = [
  { id: 'local', name: 'This device', mono: 'D', bg: palette.ink.DEFAULT, fg: palette.white, note: 'Notifications, local files and storage', group: 'ON YOUR PHONE', why: 'MIRA uses your phone for reminders, local files you attach and on-device memory.' },
  { id: 'demo', name: 'Demo mailbox & calendar', mono: 'S', bg: palette.peri.tonal, fg: palette.navy.DEFAULT, note: 'Sample data · not live', group: 'DEMO DATA', why: 'Sample emails and events so you can try MIRA safely. Nothing here is a real account.' },
  { id: 'gmail', name: 'Gmail', mono: 'G', bg: palette.error.bg, fg: palette.error.ink, note: 'Read, sort and draft replies', group: 'EMAIL & CALENDAR', why: 'Connect to let MIRA read your inbox and prepare drafts. You choose each permission.' },
  { id: 'gcal', name: 'Google Calendar', mono: 'C', bg: palette.mint.bg, fg: palette.mint.ink, note: 'See events and suggest changes' },
  { id: 'outlook', name: 'Outlook', mono: 'O', bg: palette.outlook.bg, fg: palette.outlook.ink, note: 'Sign in again to keep syncing' },
  { id: 'other', name: 'Other compatible services', mono: '+', bg: 'rgba(255,255,255,0.6)', fg: palette.ink.label, note: 'Browse supported apps', group: 'MORE' },
];

const PERMS = [
  { label: 'Read information', hint: 'See emails, events or files' },
  { label: 'Create drafts', hint: 'Prepare things for you to review' },
  { label: 'Change information', hint: 'Edit events, labels or files' },
  { label: 'Send or perform actions', hint: 'Always asks you first' },
];

const DEFAULT_WHY = 'Connect to choose what MIRA can see and do. You can revoke access any time.';

export default function ConnectedAppsScreen() {
  const [open, setOpen] = useState<string | null>(null);
  const [status, setStatus] = useState<Record<string, Status>>({
    local: 'connected', demo: 'offline', gmail: 'none', gcal: 'none', outlook: 'reauth', other: 'none',
  });
  const [perms, setPerms] = useState<Record<string, boolean[]>>({
    local: [true, true, false, false],
    demo: [true, true, false, false],
  });

  const cur = APPS.find((a) => a.id === open);
  const curStatus = cur ? status[cur.id] : 'none';
  const live = curStatus === 'connected' || curStatus === 'offline';
  const on = (cur && perms[cur.id]) || [false, false, false, false];
  const [curLabel, curFg] = STATUS[curStatus];
  const button = live
    ? { label: cur?.id === 'demo' ? 'Remove demo data' : 'Disconnect', danger: true }
    : { label: curStatus === 'reauth' ? 'Sign in again' : 'Connect', danger: false };

  return (
    <Screen>
      <View className="flex-row items-center">
        <BackButton to="Profile" label="Back to Profile" />
      </View>
      <View className="gap-4">
        <T accessibilityRole="header" className="text-30 font-medium tracking-[-0.9px]">Connected Apps</T>
        <T className="text-15 text-ink-2">Choose what MIRA can access.</T>
      </View>

      <View className="gap-10">
        {APPS.map((a) => {
          const [label, fg, bg, icon] = STATUS[status[a.id]];
          return (
            <Fragment key={a.id}>
              {a.group ? <T className="px-2 pt-6 text-12 font-bold tracking-[0.72px] text-ink-label">{a.group}</T> : null}
              <Tap label={`${a.name}, ${label}`} onPress={() => setOpen(a.id)} glass="glass2" className="w-full flex-row items-center gap-12 rounded-20 p-14">
                <View className="h-44 w-44 shrink-0 items-center justify-center rounded-14" style={{ backgroundColor: a.bg }}>
                  <T className="text-16 font-bold" style={{ color: a.fg }}>
                    {a.mono}
                  </T>
                </View>
                <View className="min-w-0 flex-1 gap-4">
                  <T className="text-15 font-bold">{a.name}</T>
                  <Chip label={label} fg={fg} bg={bg} iconD={icon} className="px-8 py-3" />
                  <T className="text-12 leading-[16.8px] text-ink-muted">{a.note}</T>
                </View>
                <Icon name="chevronRight" size={18} color={palette.ink.muted} />
              </Tap>
            </Fragment>
          );
        })}
      </View>

      <Sheet visible={!!cur} onClose={() => setOpen(null)} label={`${cur?.name ?? ''} permissions`}>
        {cur ? (
          <>
            <View className="flex-row items-center gap-12">
              <View className="h-48 w-48 items-center justify-center rounded-16" style={{ backgroundColor: cur.bg }}>
                <T className="text-17 font-bold" style={{ color: cur.fg }}>
                  {cur.mono}
                </T>
              </View>
              <View className="gap-2">
                <T className="text-19 font-bold">{cur.name}</T>
                <T className="text-12 font-bold" style={{ color: curFg }}>
                  {curLabel}
                </T>
              </View>
            </View>
            <T className="text-14 leading-[21px] text-ink-body">{cur.why ?? DEFAULT_WHY}</T>
            <View className="gap-8">
              {PERMS.map((p, i) => (
                <Tap
                  key={p.label}
                  label={p.label}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: on[i], disabled: !live }}
                  disabled={!live}
                  onPress={() => setPerms({ ...perms, [cur.id]: on.map((v, j) => (j === i ? !v : v)) })}
                  className={`min-h-58 flex-row items-center gap-12 rounded-16 border border-white/80 bg-white/60 py-8 pl-14 pr-12 ${live ? '' : 'opacity-50'}`}
                >
                  <View className="flex-1 gap-2">
                    <T className="text-14 font-bold">{p.label}</T>
                    <T className="text-12 text-ink-2">{p.hint}</T>
                  </View>
                  <Switch on={on[i]} />
                </Tap>
              ))}
            </View>
            <View className="flex-row gap-8">
              <SecondaryButton label="Done" onPress={() => setOpen(null)} height={52} radius={16} className="flex-1" />
              <Tap
                label={button.label}
                onPress={() => {
                  if (live) {
                    setStatus({ ...status, [cur.id]: 'none' });
                  }
                  setOpen(null);
                }}
                className={`h-52 flex-1 items-center justify-center rounded-16 ${button.danger ? 'bg-error-bg' : ''}`}
                style={button.danger ? undefined : fx.primary}
              >
                <T className={`text-15 font-bold ${button.danger ? 'text-error-ink' : 'text-white'}`}>{button.label}</T>
              </Tap>
            </View>
          </>
        ) : null}
      </Sheet>
    </Screen>
  );
}
