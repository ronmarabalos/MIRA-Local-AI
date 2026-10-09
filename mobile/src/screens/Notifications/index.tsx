/** Board 22-notifications. */
import { EmptyBoard } from '../../components/EmptyBoard';

export default function NotificationsScreen() {
  return (
    <EmptyBoard
      back="Home"
      backLabel="Back to Home"
      title="Notifications"
      emptyTitle="Nothing new"
      emptyBody="Reminders and alerts from MIRA appear as notifications on your phone. What MIRA did, and why, is in Activity."
      action={{ label: 'View activity', to: 'Activity' }}
    />
  );
}
