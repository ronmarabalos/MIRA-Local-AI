/** Board 17-calendar. */
import type { ReactNode } from 'react';

import { EmptyBoard } from '../../components/EmptyBoard';

export function CalendarView({ header }: { header: ReactNode }) {
  return (
    <EmptyBoard
      tab="Planner"
      header={header}
      emptyTitle="No events"
      emptyBody="MIRA does not read or change your calendar in this version. Dates found in messages are listed on Today."
      action={{ label: 'Go to Today', to: 'Home' }}
    />
  );
}
