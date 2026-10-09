import type { Channel } from '../../core/types';
import type { NativeBridge } from '../contracts';
import type { Store } from '../db';

/** One serialized permission boundary shared by startup and channel controls. */
export function createChannelManager(
  store: Pick<Store, 'getChannels' | 'saveChannel'>,
  bridge: Pick<NativeBridge, 'listNotifyingApps' | 'setEnabledPackages'>,
) {
  let pending: Promise<unknown> = Promise.resolve();
  function serial<T>(work: () => Promise<T>): Promise<T> {
    const next = pending.then(work);
    pending = next.catch(() => undefined);
    return next;
  }
  const enabled = (channels: Channel[]) =>
    channels.filter(c => c.enabled).map(c => c.packageName);
  return {
    async discover(): Promise<Channel[]> {
      const [stored, apps] = await Promise.all([
        store.getChannels(),
        bridge.listNotifyingApps(),
      ]);
      const all = new Map(stored.map(c => [c.packageName, c]));
      for (const app of apps) {
        if (!all.has(app.packageName))
          all.set(app.packageName, { ...app, enabled: false, level: 1 });
      }
      return [...all.values()].sort((a, b) => a.label.localeCompare(b.label));
    },
    sync: () =>
      serial(async () =>
        bridge.setEnabledPackages(enabled(await store.getChannels())),
      ),
    save: (channel: Channel) =>
      serial(async () => {
        const before = await store.getChannels();
        const after = [
          ...before.filter(c => c.packageName !== channel.packageName),
          channel,
        ];
        // Revoke native capture before acknowledging a disabled app in SQLite.
        await bridge.setEnabledPackages(enabled(after));
        try {
          await store.saveChannel(channel);
        } catch (error) {
          try {
            await bridge.setEnabledPackages(enabled(before));
          } catch {
            await bridge.setEnabledPackages([]);
          }
          throw error;
        }
      }),
  };
}
