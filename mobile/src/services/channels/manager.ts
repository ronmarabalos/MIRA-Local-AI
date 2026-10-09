import { getStore } from '../db';
import { bridge } from '../index';
import { createChannelManager } from './index';

let ready: Promise<ReturnType<typeof createChannelManager>> | null = null;
export function getChannelManager() {
  if (!ready) {
    ready = getStore().then(store => createChannelManager(store, bridge));
    ready.catch(() => {
      ready = null;
    });
  }
  return ready;
}
