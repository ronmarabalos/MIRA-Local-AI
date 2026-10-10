/** Board 08-teach-by-instruction. Rules typed in words are not part of this version. */
import { EmptyBoard } from '../../components/EmptyBoard';

export default function TeachInstructionScreen() {
  return (
    <EmptyBoard
      back="Teach"
      backLabel="Back to Teach MIRA"
      title="What would you like MIRA to learn?"
      emptyTitle="Not in this version"
      emptyBody="Coming later."
      action={{ label: 'My automations', to: 'Automations' }}
    />
  );
}
