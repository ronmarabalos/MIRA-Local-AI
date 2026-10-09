import { useEffect, useRef, useState } from 'react';
import type { Action, Channel, Draft, DraftStatus, Rule } from '../../core/types';
import { getStore, type Store, type StoredItem } from './index';

export interface QueryState<T> {
  data: T | undefined;
  error: Error | null;
}

/**
 * Runs `load` against the store, and again after every write, so a screen
 * always shows what is stored. `deps` are the values `load` reads.
 */
export function useQuery<T>(load: (store: Store) => Promise<T>, deps: unknown[]): QueryState<T> {
  const [state, setState] = useState<QueryState<T>>({ data: undefined, error: null });
  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    let live = true;
    let unsubscribe = () => {};

    const run = (store: Store) =>
      loadRef.current(store).then(
        data => live && setState({ data, error: null }),
        error => live && setState(prev => ({ data: prev.data, error })),
      );

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
  }, deps);

  return state;
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
