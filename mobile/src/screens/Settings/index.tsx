/** Board 24: truthful local privacy facts and persisted appearance preferences. */
import { View } from 'react-native';
import { Screen } from '../../components/Screen';
import { PrivacyProof } from '../../components/PrivacyProof';
import { T } from '../../components/T';
import {
  BackButton,
  Glass,
  SecondaryButton,
  Switch,
  Tap,
} from '../../components/ui';
import { useGo } from '../../components/nav';
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
      <PrivacyProof />
      <Glass className="gap-10 rounded-20 p-14">
        <T className="text-17 font-semibold">Privacy and permissions</T>
        <T className="text-14 text-ink-body">
          Messages stay on this phone. Replies always need your tap and
          confirmation. Notification access applies only to apps you switch on.
        </T>
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
