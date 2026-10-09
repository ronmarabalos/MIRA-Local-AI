import { open } from '@op-engineering/op-sqlite';
import { migrate } from './schema';
import { createStore, type Store } from './store';

export type { StoredItem, Store } from './store';

let ready: Promise<Store> | null = null;

/** The app's one store, opened and migrated on first use. */
export function getStore(): Promise<Store> {
  if (!ready) {
    ready = (async () => {
      const db = open({ name: 'mira.db' });
      await migrate(db);
      return createStore(db);
    })();
    // A failed open is tried again on the next call, not cached.
    ready.catch(() => {
      ready = null;
    });
  }
  return ready;
}
