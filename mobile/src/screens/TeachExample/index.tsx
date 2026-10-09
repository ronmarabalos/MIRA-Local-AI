/** Board 09-teach-by-example. Not part of this version. */
import { EmptyBoard } from '../../components/EmptyBoard';

export default function TeachExampleScreen() {
  return (
    <EmptyBoard
      back="Teach"
      backLabel="Back to Teach MIRA"
      title="Show MIRA an example."
      emptyTitle="Not in this version"
      emptyBody="Teaching by example is coming later. For now, switch on the rules MIRA already knows."
      action={{ label: 'My automations', to: 'Automations' }}
    />
  );
}
