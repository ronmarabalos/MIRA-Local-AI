/** Board 24: truthful local privacy facts and persisted appearance preferences. */
import { View } from 'react-native';
import { Screen } from '../../components/Screen';
import { PrivacyProof } from '../../components/PrivacyProof';
import { T } from '../../components/T';
import {
  BackButton,
  Glass,
  IconTile,
  SecondaryButton,
  Switch,
  Tap,
} from '../../components/ui';
import { useGo } from '../../components/nav';
import { Icon } from '../../components/Icon';
import palette from '../../theme/palette';
import { usePrefs } from '../../theme/prefs';

export default function SettingsScreen() {
  const prefs = usePrefs();
  const go = useGo();
  return (
    <Screen>
      <BackButton to="Profile" />
      <T accessibilityRole="header" className="text-30 font-medium">
        Settings
      </T>
      <Tap
        label="MIRA on this phone"
        onPress={() => go('MiraFile')}
        glass="glass2"
        className="min-h-64 flex-row items-center gap-12 rounded-20 p-14"
      >
        <IconTile name="download" fg={palette.navy.DEFAULT} bg={palette.peri.tonal} />
        <View className="flex-1 gap-2">
          <T className="text-16 font-semibold">MIRA on this phone</T>
          <T className="text-13 text-ink-2">Download, resume, or replace MIRA’s file</T>
        </View>
        <Icon name="chevronRight" size={16} color={palette.ink.muted} />
      </Tap>
      <PrivacyProof />
      <Glass className="gap-10 rounded-20 p-14">
        <T className="text-17 font-semibold">Privacy and permissions</T>
        <SecondaryButton
          label="Review app permissions"
          onPress={() => go('ConnectedApps')}
        />
        <SecondaryButton
          label="Review drafts"
          onPress={() => go('Approvals')}
        />
        <SecondaryButton label="View activity" onPress={() => go('Activity')} />
      </Glass>
      <T accessibilityRole="header" className="text-20 font-semibold">
        Appearance
      </T>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel="Theme"
        className="gap-8"
      >
        {(['light', 'dark', 'system'] as const).map(theme => (
          <Tap
            key={theme}
            label={`${theme} theme`}
            accessibilityRole="radio"
            accessibilityState={{ checked: prefs.theme === theme }}
            onPress={() => prefs.setTheme(theme)}
            className={`min-h-48 rounded-16 p-14 ${
              prefs.theme === theme ? 'bg-peri-tonal' : 'bg-white/60'
            }`}
          >
            <T>
              {theme.charAt(0).toUpperCase() + theme.slice(1)}
              {prefs.theme === theme ? ' - selected' : ''}
            </T>
          </Tap>
        ))}
      </View>
      <Tap
        label="Reduce motion"
        accessibilityRole="switch"
        accessibilityState={{ checked: prefs.reduceMotionSetting }}
        onPress={() => prefs.setReduceMotionSetting(!prefs.reduceMotionSetting)}
        className="min-h-58 flex-row items-center justify-between gap-12"
      >
        <T>Reduce motion</T>
        <Switch on={prefs.reduceMotionSetting} />
      </Tap>
    </Screen>
  );
}
