import { RulesPanel } from '../../components/RulesPanel';
import { Screen } from '../../components/Screen';
import { T } from '../../components/T';
import { BackButton } from '../../components/ui';

export default function AutomationsScreen() {
  return (
    <Screen>
      <BackButton to="Teach" />
      <T accessibilityRole="header" className="text-30 font-medium tracking-[-0.9px]">
        My automations
      </T>
      <RulesPanel />
    </Screen>
  );
}
