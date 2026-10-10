/** Board 22-notifications. */
import { EmptyBoard } from '../../components/EmptyBoard';

export default function NotificationsScreen() {
  return (
    <EmptyBoard
      back="Home"
      backLabel="Back to Home"
      title="Notifications"
      emptyTitle="Nothing new"
      emptyBody="Reminders show up as phone notifications."
      action={{ label: 'View activity', to: 'Activity' }}
    />
  );
}
