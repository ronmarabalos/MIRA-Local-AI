/** Board 20-offline-and-sync. */
import { EmptyBoard } from '../../components/EmptyBoard';

export default function OfflineSyncScreen() {
  return (
    <EmptyBoard
      back="Home"
      backLabel="Back to Home"
      title="Offline"
      lead="MIRA works without a connection."
      emptyTitle="Nothing is waiting"
      emptyBody="Reading, reminders, and drafts all happen on this phone. A reply you approve while offline waits in Approvals and sends when the phone is back online."
      action={{ label: 'Review drafts', to: 'Approvals' }}
    />
  );
}
