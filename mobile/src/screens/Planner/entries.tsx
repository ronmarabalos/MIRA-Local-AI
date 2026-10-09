/** What both Planner views share: the query for dated messages, how a date reads, and a row. */
import type { ReactNode } from 'react';

import { ReportItem } from '../../components/ReportItem';
import { T } from '../../components/T';
import { Tap } from '../../components/ui';
import { plannerEntries, type PlannerEntry } from '../../core/planner';
import {
  type QueryState,
  useChannels,
  useQuery,
} from '../../services/db/hooks';

const DAY = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 30;
const MAX_ITEMS = 2000;
const MAX_ACTIONS = 1000;

/** The dates MIRA found in messages stored in the last 30 days. Re-runs after every write. */
export function usePlannerEntries(): QueryState<PlannerEntry[]> {
  return useQuery(async store => {
    const now = Date.now();
    const [items, actions] = await Promise.all([
      store.getItems(now - WINDOW_DAYS * DAY, now + DAY, MAX_ITEMS),
      store.getActions(Number.MAX_SAFE_INTEGER, MAX_ACTIONS),
    ]);
    return plannerEntries(items, actions);
  }, []);
}

/** "Mon, Oct 12 · 11:59 PM", or the phrase as written when no day could be pinned down. */
export function whenOf(entry: PlannerEntry): string {
  if (entry.at === null) return `No exact date: ${entry.item.record.dateText}`;
  const date = new Date(entry.at);
  const day = date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const time = date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${day} · ${time}`;
}

/** One dated message: when, then the shared report row, which opens the message. */
export function EntryRow({ entry }: { entry: PlannerEntry }) {
  const { data: channels } = useChannels();
  const packageName = entry.item.message.packageName;
  return (
    <ReportItem
      item={entry.item}
      appLabel={
        channels?.find(channel => channel.packageName === packageName)?.label ??
        'Another app'
      }
      label={entry.reminder ? `${whenOf(entry)} · Reminder set` : whenOf(entry)}
    />
  );
}

/** The loading and failure lines both views share; shows `children` once the entries are in. */
export function LoadState({
  state,
  children,
}: {
  state: QueryState<PlannerEntry[]>;
  children: ReactNode;
}) {
  if (state.error) {
    return (
      <Tap
        label="Try again"
        onPress={state.retry}
        className="rounded-16 bg-error-bg px-14 py-12"
      >
        <T className="text-13 font-semibold text-error-ink">
          Your messages could not be loaded. Tap to try again.
        </T>
      </Tap>
    );
  }
  if (state.data === undefined)
    return <T className="text-14 text-ink-2">Loading…</T>;
  return <>{children}</>;
}
