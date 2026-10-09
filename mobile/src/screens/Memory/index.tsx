/** Board 18-personal-memory. */
import { EmptyBoard } from '../../components/EmptyBoard';

export default function MemoryScreen() {
  return (
    <EmptyBoard
      back="Profile"
      backLabel="Back to Profile"
      title="What MIRA Remembers"
      emptyTitle="Nothing saved"
      emptyBody="MIRA does not keep preferences or facts about you in this version. It stores only the messages from apps you switch on, on this phone."
    />
  );
}
