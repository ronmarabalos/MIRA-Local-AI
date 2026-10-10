/** Board 18-personal-memory. */
import { EmptyBoard } from '../../components/EmptyBoard';

export default function MemoryScreen() {
  return (
    <EmptyBoard
      back="Profile"
      backLabel="Back to Profile"
      title="What MIRA Remembers"
      emptyTitle="Nothing saved"
      emptyBody="MIRA keeps only your messages, on this phone."
    />
  );
}
