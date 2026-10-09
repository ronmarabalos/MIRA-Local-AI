/** Board 20-offline-and-sync, with the board's simulated offline switch. */
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { Companion } from '../../components/Companion';
import { D, Icon } from '../../components/Icon';
import { Spin } from '../../components/motion';
import { useGo } from '../../components/nav';
import { Screen } from '../../components/Screen';
import { T } from '../../components/T';
import { BackButton, Glass, PrimaryButton, Rows, Switch, Tap } from '../../components/ui';
import { fx } from '../../theme/effects';
import palette from '../../theme/palette';

type Look = { status: string; fg: string; bg: string; running: boolean };

const QUEUED: Look = { status: 'Queued', fg: palette.ink.label, bg: 'rgba(255,255,255,0.6)', running: false };
const CHECKING: Look = { status: 'Re-checking', fg: palette.navy.pressed, bg: palette.peri.tonal, running: true };
const AWAITING: Look = { status: 'Needs approval', fg: palette.warning.ink, bg: palette.warning.bg, running: false };
const DONE: Look = { status: 'Completed', fg: palette.success.ink, bg: palette.success.bg, running: false };

const OFFLINE_CAPS = ['Local AI assistant', 'Saved preferences & memory', 'Tasks & reminders', 'Previously synced messages', 'Draft creation', 'Supported local automations'];
const ONLINE_CAPS = ['Receiving new emails', 'Sending emails', 'Refreshing calendars', 'External service actions'];

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-12 py-13">
      <T className="text-14 text-ink-2">{label}</T>
      <T className="shrink text-right text-14 font-bold">{value}</T>
    </View>
  );
}

export default function OfflineSyncScreen() {
  const go = useGo();
  const [offline, setOffline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [retried, setRetried] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const phase = offline ? 'off' : syncing ? 'sync' : 'on';
  const pick = (needsApproval: boolean) => (phase === 'off' ? QUEUED : phase === 'sync' ? CHECKING : needsApproval ? AWAITING : DONE);
  const pending = [
    { title: 'Send reply to Sam Rivera', detail: 'Draft saved yesterday · Demo mailbox', icon: D.mail, ...pick(true) },
    { title: 'Email Priya the report draft', detail: 'Asked in MIRA chat today', icon: D.mail, ...pick(true) },
    { title: 'Refresh calendars', detail: 'Read-only · approved earlier', icon: D.refresh, ...pick(false) },
  ];

  const toggle = () => {
    if (offline) {
      setOffline(false);
      setSyncing(true);
      timer.current = setTimeout(() => setSyncing(false), 1600);
    } else {
      setOffline(true);
      setSyncing(false);
    }
  };

  return (
    <Screen gap={18}>
      <View className="flex-row items-center">
        <BackButton to="Home" label="Back to Home" />
      </View>
      <T accessibilityRole="header" className="text-30 font-medium tracking-[-0.9px]">Offline & Sync</T>

      <Tap
        label="Simulate offline mode"
        accessibilityRole="switch"
        accessibilityState={{ checked: offline }}
        onPress={toggle}
        className="min-h-56 flex-row items-center gap-12 rounded-18 border-[1.5px] border-dashed border-peri-300 bg-white/60 py-8 pl-14 pr-12"
      >
        <View className="rounded-6 bg-warning-bg px-7 py-4">
          <T className="text-10 font-bold tracking-[0.8px] text-warning-ink">DEMO</T>
        </View>
        <T className="flex-1 text-14 font-bold">Simulate offline mode</T>
        <Switch on={offline} />
      </Tap>

      <View className={`flex-row items-center gap-16 overflow-hidden rounded-28 px-20 py-22 ${offline ? 'bg-ink' : 'bg-success-bg'}`}>
        <View className="absolute h-200 w-200 rounded-full" style={[fx.glowSoft, { right: -50, top: -60 }]} />
        <View className="h-64 w-64 shrink-0">
          <Companion size={64} mode={offline ? 'offline' : syncing ? 'thinking' : 'idle'} theme={offline ? 'dark' : 'light'} />
        </View>
        <View className="flex-1 gap-4">
          <T className={`text-19 font-bold leading-[24.7px] ${offline ? 'text-white' : 'text-mint-deep'}`}>
            {offline ? 'You’re offline. MIRA is still here.' : syncing ? 'Back online. Syncing…' : 'You’re online. All synced.'}
          </T>
          <T className={`text-13 leading-[18.85px] opacity-85 ${offline ? 'text-white' : 'text-mint-deep'}`}>
            {offline
              ? 'Your assistant, memory and tasks keep working on this device.'
              : syncing
                ? 'Checking queued actions before anything runs.'
                : 'Queued actions were re-checked and are waiting for you.'}
          </T>
        </View>
      </View>

      <View className="flex-row gap-10">
        <Glass className="flex-1 gap-10 rounded-22 p-14">
          <View className="flex-row items-center gap-6">
            <Icon name="phoneBare" size={15} strokeWidth={2.2} color={palette.success.ink} />
            <T className="text-12 font-bold text-success-ink">Works offline</T>
          </View>
          {OFFLINE_CAPS.map((c) => (
            <View key={c} className="flex-row gap-6">
              <View className="mt-1">
                <Icon name="check" size={13} strokeWidth={3} color={palette.success.DEFAULT} />
              </View>
              <T className="flex-1 text-12 font-semibold leading-[16.2px]">{c}</T>
            </View>
          ))}
        </Glass>
        <Glass className="flex-1 gap-10 rounded-22 p-14">
          <View className="flex-row items-center gap-6">
            <Icon name="cloud" size={15} strokeWidth={2.2} color={palette.ink.label} />
            <T className="text-12 font-bold text-ink-label">Needs internet</T>
          </View>
          {ONLINE_CAPS.map((c) => (
            <View key={c} className="flex-row gap-6">
              <View className="mt-1">
                <Icon d={offline ? D.clock : D.check} size={13} strokeWidth={2.6} color={offline ? palette.ink.muted : palette.ink.DEFAULT} />
              </View>
              <T className={`flex-1 text-12 font-semibold leading-[16.2px] ${offline ? 'text-ink-muted' : 'text-ink'}`}>{c}</T>
            </View>
          ))}
        </Glass>
      </View>

      <Glass className="rounded-22 px-16 py-4">
        <Rows>
          <Fact label="Last successful sync" value={phase === 'on' ? 'Just now' : 'Today 8:45 AM'} />
          <Fact label="Cached on device" value="6 emails · 10 events · 7 memories" />
        </Rows>
      </Glass>

      <View className="gap-10">
        <View className="flex-row items-center justify-between">
          <T accessibilityRole="header" className="text-18 font-bold">Pending When Online</T>
          <T className="text-12 font-bold text-ink-label">{phase === 'on' ? '2 need you' : '3 queued'}</T>
        </View>
        {pending.map((p) => (
          <Glass key={p.title} className="flex-row items-center gap-12 rounded-18 px-14 py-12">
            <View className="h-36 w-36 shrink-0 items-center justify-center rounded-12" style={{ backgroundColor: p.bg }}>
              {p.running ? (
                <Spin>
                  <View className="h-16 w-16 rounded-full border-2 border-white/80" style={{ borderTopColor: palette.navy.DEFAULT }} />
                </Spin>
              ) : (
                <Icon d={p.icon} size={18} strokeWidth={2.2} color={p.fg} />
              )}
            </View>
            <View className="min-w-0 flex-1 gap-2">
              <T className="text-14 font-bold">{p.title}</T>
              <T className="text-12 text-ink-muted">{p.detail}</T>
            </View>
            <View className="shrink-0 rounded-full px-8 py-4" style={{ backgroundColor: p.bg }}>
              <T className="text-11 font-bold" style={{ color: p.fg }}>
                {p.status}
              </T>
            </View>
          </Glass>
        ))}
        {phase === 'on' ? (
          <PrimaryButton
            label="Review & approve queued actions"
            onPress={() => go('Approvals')}
            height={50}
            radius={16}
            textClassName="text-15"
            style={{}}
          />
        ) : null}
      </View>

      <View className="gap-10">
        <T accessibilityRole="header" className="text-18 font-bold">Sync history</T>
        <Glass className="rounded-22 px-16 py-4">
          <Rows>
            <View className="flex-row items-center gap-12 py-12">
              <View className="h-28 w-28 items-center justify-center rounded-9 bg-success-bg">
                <Icon name="check" size={14} strokeWidth={3} color={palette.success.ink} />
              </View>
              <View className="flex-1 gap-2">
                <T className="text-14 font-bold">Email & calendar synced</T>
                <T className="text-12 text-ink-muted">Today 8:45 AM · 2 new emails</T>
              </View>
            </View>
            <View className="flex-row items-center gap-12 py-12">
              <View className={`h-28 w-28 items-center justify-center rounded-9 ${retried ? 'bg-success-bg' : 'bg-error-bg'}`}>
                <Icon d={retried ? D.check : D.x} size={14} strokeWidth={3} color={retried ? palette.success.ink : palette.error.ink} />
              </View>
              <View className="flex-1 gap-2">
                <T className="text-14 font-bold">{retried ? 'Calendar refresh succeeded' : 'Calendar refresh failed'}</T>
                <T className="text-12 text-ink-muted">{retried ? 'Just now' : 'Today 9:12 AM · no connection'}</T>
              </View>
              {retried ? null : (
                <Tap
                  label={offline ? 'Retry when online' : 'Retry'}
                  onPress={() => !offline && setRetried(true)}
                  className="h-38 justify-center rounded-12 border border-white/80 bg-white/60 px-12"
                >
                  <T className="text-13 font-bold text-navy">{offline ? 'Retry when online' : 'Retry'}</T>
                </Tap>
              )}
            </View>
          </Rows>
        </Glass>
      </View>
    </Screen>
  );
}
