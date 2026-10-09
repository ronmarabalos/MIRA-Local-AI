/** Board 24-settings-and-privacy. Theme and Reduce motion apply app-wide. */
import { Fragment, useState } from 'react';
import { View, type ViewStyle } from 'react-native';

import { Icon } from '../../components/Icon';
import { useGo, type Board } from '../../components/nav';
import { Dialog } from '../../components/Overlay';
import { Screen } from '../../components/Screen';
import { T } from '../../components/T';
import { BackButton, Glass, SecondaryButton, Switch, Tap } from '../../components/ui';
import { fx } from '../../theme/effects';
import palette from '../../theme/palette';
import { usePrefs, type ThemeChoice } from '../../theme/prefs';

type SwitchKey = 'offlineAuto' | 'askSend' | 'askModify' | 'pauseAll' | 'localOnly' | 'remind' | 'approvals' | 'autoUpd';

type Row =
  | { kind: 'link'; label: string; to: Board; value?: string }
  | { kind: 'switch'; key: SwitchKey | 'motion'; label: string; hint?: string }
  | { kind: 'theme' }
  | { kind: 'danger'; label: string };

const GROUPS: { title: string; rows: Row[] }[] = [
  {
    title: 'PERSONALIZATION',
    rows: [
      { kind: 'link', label: 'Communication preferences', to: 'Memory', value: 'Friendly, concise' },
      { kind: 'link', label: 'Default AI behavior', to: 'Teach', value: 'Suggest, then ask' },
      { kind: 'link', label: 'Assistant name', to: 'Setup', value: 'MIRA' },
      { kind: 'link', label: 'Saved instructions', to: 'Memory', value: '1' },
    ],
  },
  {
    title: 'AI & DEVICE',
    rows: [
      { kind: 'link', label: 'Local model', to: 'ModelSetup', value: 'Demo mode' },
      { kind: 'switch', key: 'offlineAuto', label: 'Keep working offline' },
      { kind: 'link', label: 'Storage used', to: 'OfflineSync', value: '214 MB' },
    ],
  },
  {
    title: 'AUTOMATION',
    rows: [
      { kind: 'switch', key: 'askSend', label: 'Ask before sending anything', hint: 'Can’t be turned off for email' },
      { kind: 'switch', key: 'askModify', label: 'Ask before changing calendars or files' },
      { kind: 'switch', key: 'pauseAll', label: 'Pause all automations' },
      { kind: 'link', label: 'Execution limits', to: 'Automations', value: 'Drafts only' },
    ],
  },
  {
    title: 'PRIVACY',
    rows: [
      { kind: 'switch', key: 'localOnly', label: 'Keep memory on this device only' },
      { kind: 'link', label: 'Manage memories', to: 'Memory', value: '7' },
      { kind: 'link', label: 'Review app permissions', to: 'ConnectedApps' },
      { kind: 'link', label: 'Disconnect accounts', to: 'ConnectedApps' },
      { kind: 'danger', label: 'Delete local data' },
    ],
  },
  { title: 'APPEARANCE', rows: [{ kind: 'theme' }, { kind: 'switch', key: 'motion', label: 'Reduce motion' }] },
  {
    title: 'NOTIFICATIONS',
    rows: [
      { kind: 'switch', key: 'remind', label: 'Reminder alerts' },
      { kind: 'switch', key: 'approvals', label: 'Approval requests' },
      { kind: 'switch', key: 'autoUpd', label: 'Automation updates' },
    ],
  },
];

const THEMES: { id: ThemeChoice; label: string; swatch: ViewStyle }[] = [
  { id: 'light', label: 'Light', swatch: { backgroundColor: palette.peri.swatch } },
  { id: 'dark', label: 'Dark', swatch: { backgroundColor: palette.ink.DEFAULT } },
  { id: 'system', label: 'System', swatch: fx.systemSwatch },
];

export default function SettingsScreen() {
  const go = useGo();
  const prefs = usePrefs();
  const [wipe, setWipe] = useState(false);
  const [sw, setSw] = useState<Record<SwitchKey, boolean>>({
    localOnly: true, offlineAuto: true, askSend: true, askModify: true, pauseAll: false, remind: true, approvals: true, autoUpd: false,
  });

  const isOn = (key: SwitchKey | 'motion') => (key === 'motion' ? prefs.reduceMotionSetting : sw[key]);
  const flip = (key: SwitchKey | 'motion') =>
    key === 'motion' ? prefs.setReduceMotionSetting(!prefs.reduceMotionSetting) : setSw({ ...sw, [key]: !sw[key] });

  const row = (r: Row, first: boolean) => {
    const sep = first ? '' : 'border-t border-ink/8';
    switch (r.kind) {
      case 'link':
        return (
          <Tap label={r.label} onPress={() => go(r.to)} className={`min-h-56 flex-row items-center gap-12 px-14 ${sep}`}>
            <View className="flex-1 py-8">
              <T className="text-15 font-semibold">{r.label}</T>
            </View>
            {r.value ? <T className="text-13 text-ink-muted">{r.value}</T> : null}
            <Icon name="chevronRight" size={16} color={palette.ink.muted} />
          </Tap>
        );
      case 'switch':
        return (
          <Tap
            label={r.label}
            accessibilityRole="switch"
            accessibilityState={{ checked: isOn(r.key) }}
            onPress={() => flip(r.key)}
            className={`min-h-56 w-full flex-row items-center gap-12 bg-white/60 px-14 ${sep}`}
          >
            <View className="flex-1 gap-2 py-8">
              <T className="text-15 font-semibold">{r.label}</T>
              {r.hint ? <T className="text-12 text-ink-muted">{r.hint}</T> : null}
            </View>
            <Switch on={isOn(r.key)} />
          </Tap>
        );
      case 'theme':
        return (
          <View accessibilityRole="radiogroup" accessibilityLabel="Theme" className={`flex-row gap-8 p-12 ${sep}`}>
            {THEMES.map((t) => {
              const sel = prefs.theme === t.id;
              return (
                <Tap
                  key={t.id}
                  label={t.label}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: sel }}
                  onPress={() => prefs.setTheme(t.id)}
                  className={`flex-1 items-center gap-8 rounded-16 px-6 py-10 ${
                    sel ? 'border-[1.5px] border-peri-600 bg-white/55' : 'border border-white/80 bg-white'
                  }`}
                >
                  <View className="h-38 w-54 rounded-10 border border-white/80" style={t.swatch} />
                  <T className="text-13 font-bold">{t.label}</T>
                </Tap>
              );
            })}
          </View>
        );
      case 'danger':
        return (
          <Tap label={r.label} onPress={() => setWipe(true)} className={`min-h-56 w-full flex-row items-center gap-12 bg-white/60 px-14 ${sep}`}>
            <Icon name="trash" size={18} color={palette.error.ink} />
            <T className="text-15 font-bold text-error-ink">{r.label}</T>
          </Tap>
        );
    }
  };

  return (
    <Screen gap={18}>
      <View className="flex-row items-center">
        <BackButton to="Profile" label="Back to Profile" />
      </View>
      <T accessibilityRole="header" className="text-30 font-medium tracking-[-0.9px]">Settings</T>

      {GROUPS.map((g) => (
        <View key={g.title} className="gap-8">
          <T accessibilityRole="header" className="pl-4 text-12 font-bold tracking-[0.96px] text-ink-label">{g.title}</T>
          <Glass className="overflow-hidden rounded-22">
            {g.rows.map((r, i) => (
              <Fragment key={i}>{row(r, i === 0)}</Fragment>
            ))}
          </Glass>
        </View>
      ))}

      <Dialog visible={wipe} onClose={() => setWipe(false)} label="Delete local data">
        <T className="text-19 font-bold">Delete all local data?</T>
        <T className="text-14 leading-[21px] text-ink-body">
          This removes memories, preferences, cached emails, drafts and automations from this device. It can’t be undone.
        </T>
        <View className="flex-row gap-8">
          <SecondaryButton label="Cancel" onPress={() => setWipe(false)} height={50} radius={16} className="flex-1" />
          <Tap label="Delete (demo)" onPress={() => setWipe(false)} className="h-50 flex-1 items-center justify-center rounded-16 bg-error-ink">
            <T className="text-15 font-bold text-white">Delete (demo)</T>
          </Tap>
        </View>
      </Dialog>
    </Screen>
  );
}
