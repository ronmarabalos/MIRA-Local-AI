import type { Channel } from '../../core/types';
import type { NativeBridge } from '../contracts';
import type { Store } from '../db';

const MESSAGE_APPS = new Set([
  'com.facebook.orca',
  'com.google.android.gm',
  'com.google.android.apps.messaging',
  'com.google.android.apps.classroom',
  'org.telegram.messenger',
  'com.whatsapp',
  'com.viber.voip',
  'com.microsoft.office.outlook',
  'com.discord',
]);

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
      // Switched-on apps first, then apps people get messages in, then the rest by name.
      const rank = (c: Channel) =>
        c.enabled ? 0 : MESSAGE_APPS.has(c.packageName) ? 1 : 2;
      return [...all.values()].sort(
        (a, b) => rank(a) - rank(b) || a.label.localeCompare(b.label),
      );
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
