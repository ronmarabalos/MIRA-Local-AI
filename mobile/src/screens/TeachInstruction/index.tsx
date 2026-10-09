/** Board 08-teach-by-instruction. Rules typed in words are not part of this version. */
import { EmptyBoard } from '../../components/EmptyBoard';

export default function TeachInstructionScreen() {
  return (
    <EmptyBoard
      back="Teach"
      backLabel="Back to Teach MIRA"
      title="What would you like MIRA to learn?"
      emptyTitle="Not in this version"
      emptyBody="Writing a rule in your own words is coming later. For now, switch on the rules MIRA already knows."
      action={{ label: 'My automations', to: 'Automations' }}
    />
  );
}
