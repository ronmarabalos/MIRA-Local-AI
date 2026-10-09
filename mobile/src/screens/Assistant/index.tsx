/** Board 06-mira-assistant. Asking MIRA questions is not part of this version. */
import { EmptyBoard } from '../../components/EmptyBoard';

export default function AssistantScreen() {
  return (
    <EmptyBoard
      back="Home"
      backLabel="Back to Home"
      title="Ask MIRA"
      lead="Questions about your messages."
      emptyTitle="Not in this version"
      emptyBody="Asking MIRA about your messages is coming later. Today lists what matters, each with its source."
      action={{ label: 'Go to Today', to: 'Home' }}
    />
  );
}
