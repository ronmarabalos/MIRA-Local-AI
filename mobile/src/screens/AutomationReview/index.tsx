import { Screen } from '../../components/Screen';
import { T } from '../../components/T';
import { BackButton, SecondaryButton } from '../../components/ui';
import { RulesPanel } from '../../components/RulesPanel';
import { useGo } from '../../components/nav';
export default function RulesScreen() {
  const go = useGo();
  return (
    <Screen>
      <BackButton to="Teach" />
      <T accessibilityRole="header" className="text-30 font-medium">
        Review rules
      </T>
      <RulesPanel />
      <SecondaryButton label="View activity" onPress={() => go('Activity')} />
      <SecondaryButton label="Review drafts" onPress={() => go('Approvals')} />
    </Screen>
  );
}
