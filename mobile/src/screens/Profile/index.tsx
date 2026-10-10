/** Board 23-profile. */
import { View } from 'react-native';

import { Companion } from '../../components/Companion';
import { Icon, type IconName } from '../../components/Icon';
import { useGo, type Board } from '../../components/nav';
import { Screen } from '../../components/Screen';
import { T } from '../../components/T';
import { BackButton, Glass, Tap } from '../../components/ui';
import palette from '../../theme/palette';
import { useDisplayName } from '../../theme/prefs';

const LINKS: { label: string; icon: IconName; to: Board; count?: string }[] = [
  { label: 'Personal information', icon: 'user', to: 'Setup' },
  { label: 'My preferences', icon: 'bulb', to: 'Teach' },
  { label: 'Personal memory', icon: 'bookmark', to: 'Memory' },
  { label: 'Connected apps', icon: 'link', to: 'ConnectedApps' },
  { label: 'Privacy & permissions', icon: 'shield', to: 'Settings' },
  { label: 'Offline settings', icon: 'phone', to: 'OfflineSync' },
  { label: 'Activity history', icon: 'history', to: 'Activity' },
  { label: 'Help & about MIRA', icon: 'help', to: 'Main' },
];

export default function ProfileScreen() {
  const go = useGo();
  const name = useDisplayName();

  return (
    <Screen gap={18}>
      <View className="flex-row items-center justify-between">
        <BackButton to="Home" label="Back to Home" />
        <Tap label="Settings" onPress={() => go('Settings')} glass="glass2" className="h-44 w-44 items-center justify-center rounded-14">
          <Icon name="gear" size={20} />
        </Tap>
      </View>

      <View className="items-center gap-10">
        <View>
          <View className="h-96 w-96 items-center justify-center rounded-32 bg-peri-tonal">
            <T className="text-38 font-bold text-navy">{name[0].toUpperCase()}</T>
          </View>
          <View className="absolute -bottom-6 -right-6">
            <Companion size={32} />
          </View>
        </View>
        <T accessibilityRole="header" className="text-26 font-bold tracking-[-0.52px]">{name}</T>
      </View>

      <View className="flex-row gap-10">
        <Tap label="My automations" onPress={() => go('Automations')} glass="glass2" className="flex-1 gap-8 rounded-20 p-14">
          <T className="text-12 font-bold text-ink-label">Rules</T>
          <T className="text-15 font-bold leading-[19.5px]">{'Switch rules\non or off'}</T>
        </Tap>
        <Tap label="Where MIRA runs" onPress={() => go('MiraFile')} glass="glass2" className="flex-1 gap-8 rounded-20 p-14">
          <T className="text-12 font-bold text-ink-label">Where MIRA runs</T>
          <T className="text-15 font-bold leading-[19.5px]">On this phone</T>
          <View className="self-start rounded-full bg-success-bg px-8 py-4">
            <T className="text-11 font-bold text-success-ink">Works offline</T>
          </View>
        </Tap>
      </View>

      <Glass accessibilityLabel="Profile" className="overflow-hidden rounded-22">
        {LINKS.map((l, i) => (
          <Tap
            key={l.label}
            label={l.label}
            onPress={() => go(l.to)}
            className={`min-h-56 flex-row items-center gap-12 px-14 ${i < LINKS.length - 1 ? 'border-b border-ink/8' : ''}`}
          >
            <Icon name={l.icon} size={20} color={palette.navy.DEFAULT} />
            <T className="flex-1 text-15 font-semibold">{l.label}</T>
            {l.count ? <T className="text-13 text-ink-muted">{l.count}</T> : null}
            <Icon name="chevronRight" size={16} color={palette.ink.muted} />
          </Tap>
        ))}
      </Glass>
    </Screen>
  );
}
