/** Board 10-automation-builder. Not part of this version. */
import { EmptyBoard } from '../../components/EmptyBoard';

export default function AutomationBuilderScreen() {
  return (
    <EmptyBoard
      back="Teach"
      title="Create an Automation"
      emptyTitle="Not in this version"
      emptyBody="Building your own rule is coming later. For now, switch on the rules MIRA already knows."
      action={{ label: 'My automations', to: 'Automations' }}
    />
  );
}
