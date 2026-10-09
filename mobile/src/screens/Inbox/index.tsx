/** Board 13-inbox. Not connected in this version: messages are listed on Today. */
import { EmptyBoard } from '../../components/EmptyBoard';

export default function InboxScreen() {
  return (
    <EmptyBoard
      tab="Inbox"
      title="Inbox"
      lead="Messages from the apps you switch on."
      emptyTitle="Nothing here right now"
      emptyBody="Your messages are listed on Today, each with the original it came from."
      action={{ label: 'Go to Today', to: 'Home' }}
    />
  );
}
