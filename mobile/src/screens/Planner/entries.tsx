/** What both Planner views share: the query for dated messages, how a date reads, and a row. */
import { type ReactNode, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { ReportItem } from '../../components/ReportItem';
import { T } from '../../components/T';
import { Tap } from '../../components/ui';
import { resolveWhen } from '../../core/dates';
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
      // Dated messages only, chosen by the database: newer chatter cannot push a deadline out.
      store.getDatedItems(now - WINDOW_DAYS * DAY, now + DAY, MAX_ITEMS),
      store.getActions(Number.MAX_SAFE_INTEGER, MAX_ACTIONS),
    ]);
    return plannerEntries(items, actions);
  }, []);
}

/**
 * The current time, kept current: refreshed when the app comes back to the
 * front and at the next midnight, so "Today" does not go stale on a tab that
 * stays open overnight.
 */
export function useNow(): number {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const refresh = () => setNow(Date.now());
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') refresh();
    });
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const timer = setTimeout(
      refresh,
      Math.max(1, midnight.getTime() - Date.now()),
    );
    return () => {
      subscription.remove();
      clearTimeout(timer);
    };
  }, [now]);
  return now;
}

/**
 * "Mon, Oct 12 · 11:59 PM" when the message gave a time, "Mon, Oct 12" when it
 * gave only a day, or the phrase as written when no day could be pinned down.
 */
export function whenOf(entry: PlannerEntry): string {
  const { message, record } = entry.item;
  if (entry.at === null) return `No exact date: ${record.dateText}`;
  const date = new Date(entry.at);
  const day = date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const gaveTime = resolveWhen(
    record.dateText ?? '',
    message.text,
    message.postedAt,
  )?.hasTime;
  if (!gaveTime) return day;
  return `${day} · ${date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })}`;
}

/** App names by package, read once for a whole view. */
export function useAppNames(): (packageName: string) => string {
  const { data: channels } = useChannels();
  return packageName =>
    channels?.find(channel => channel.packageName === packageName)?.label ??
    'Another app';
}

/** One dated message: when, then the shared report row, which opens the message. */
export function EntryRow({
  entry,
  appLabel,
}: {
  entry: PlannerEntry;
  appLabel: string;
}) {
  return (
    <ReportItem
      item={entry.item}
      appLabel={appLabel}
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
