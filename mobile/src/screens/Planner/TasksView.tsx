/** Board 16-tasks-and-reminders. */
import type { ReactNode } from 'react';

import { EmptyBoard } from '../../components/EmptyBoard';

export function TasksView({ header }: { header: ReactNode }) {
  return (
    <EmptyBoard
      tab="Planner"
      header={header}
      emptyTitle="No tasks yet"
      emptyBody="Reminders MIRA sets from your messages appear as notifications on your phone. Dates found in messages are listed on Today."
      action={{ label: 'Go to Today', to: 'Home' }}
    />
  );
}
