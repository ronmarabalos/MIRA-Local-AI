import { RulesPanel } from '../../components/RulesPanel';
import { Screen } from '../../components/Screen';
import { T } from '../../components/T';
import { BackButton } from '../../components/ui';

export default function AutomationReviewScreen() {
  return (
    <Screen>
      <BackButton to="Teach" />
      <T accessibilityRole="header" className="text-30 font-medium tracking-[-0.9px]">
        Review rules
      </T>
      <RulesPanel />
    </Screen>
  );
}
