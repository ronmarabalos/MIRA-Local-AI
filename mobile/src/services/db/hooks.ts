import { useCallback, useEffect, useRef, useState } from 'react';
import { buildReport } from '../../core/report';
import type { Action, Channel, Draft, DraftStatus, Rule } from '../../core/types';
import { getStore, type Store, type StoredItem } from './index';

export interface QueryState<T> {
  data: T | undefined;
  error: Error | null;
  retry(): void;
}

/**
 * Runs `load` against the store, and again after every write, so a screen
 * always shows what is stored. `deps` are the values `load` reads.
 */
export function useQuery<T>(load: (store: Store) => Promise<T>, deps: unknown[]): QueryState<T> {
  const [state, setState] = useState<Omit<QueryState<T>, 'retry'>>({
    data: undefined,
    error: null,
  });
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt(value => value + 1), []);
  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    let live = true;
    let unsubscribe = () => {};
    let request = 0;
    setState({ data: undefined, error: null });

    const run = (store: Store) => {
      const current = ++request;
      return loadRef.current(store).then(
        data => live && current === request && setState({ data, error: null }),
        error => live && current === request && setState(prev => ({ data: prev.data, error })),
      );
    };

    getStore().then(
      store => {
        if (!live) return;
        unsubscribe = store.subscribe(() => run(store));
        run(store);
      },
      error => live && setState({ data: undefined, error }),
    );

    return () => {
      live = false;
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, ...deps]);

  return { ...state, retry };
}

/** A consistent report query, refreshed after writes or a new local day. */
export function useDayReport(day: number, limit: number) {
  const from = startOfDay(day);
  const next = new Date(from);
  next.setDate(next.getDate() + 1);
  const to = next.getTime();
  return useQuery(
    async store => {
      const [page, actions, channels] = await Promise.all([
        store.getItems(from, to, limit + 1),
        store.getActionsBetween(from, to),
        store.getChannels(),
      ]);
      const items = page.slice(0, limit);
      const report = buildReport(items, actions);
      // An action today can refer to a message captured on an earlier day.
      report.handled = await Promise.all(
        report.handled.map(async line => ({
          ...line,
          item: line.item ?? (await store.getItem(line.action.messageId)),
        })),
      );
      return { report, items, channels, hasMore: page.length > limit };
    },
    [from, to, limit],
  );
}

/** Midnight at the start of the day holding `time`, in local time. */
export function startOfDay(time: number): number {
  const date = new Date(time);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

const DAY = 24 * 60 * 60 * 1000;

/** Today: everything posted on the day holding `day`. */
export function useDayItems(day: number): QueryState<StoredItem[]> {
  const from = startOfDay(day);
  return useQuery(store => store.getItems(from, from + DAY), [from]);
}

/** Item detail. */
export function useItem(messageId: string): QueryState<StoredItem | null> {
  return useQuery(store => store.getItem(messageId), [messageId]);
}

/** Channels. */
export function useChannels(): QueryState<Channel[]> {
  return useQuery(store => store.getChannels(), []);
}

/** Approvals. */
export function useDrafts(status: DraftStatus = 'waiting'): QueryState<Draft[]> {
  return useQuery(store => store.getDrafts(status), [status]);
}

/** Activity log, first page. */
export function useActions(): QueryState<Action[]> {
  return useQuery(store => store.getActions(), []);
}

/** Rules. */
export function useRules(): QueryState<Rule[]> {
  return useQuery(store => store.getRules(), []);
}
