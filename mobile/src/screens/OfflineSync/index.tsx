/** Board 20-offline-and-sync. */
import { EmptyBoard } from '../../components/EmptyBoard';

export default function OfflineSyncScreen() {
  return (
    <EmptyBoard
      back="Home"
      backLabel="Back to Home"
      title="Offline"
      emptyTitle="Nothing is waiting"
      emptyBody="Replies approved offline send when you’re back online."
      action={{ label: 'Review drafts', to: 'Approvals' }}
    />
  );
}
