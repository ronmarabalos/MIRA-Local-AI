import { testStore } from '../test-support/sqlite';
import { createChannelManager } from '../src/services/channels';
import { createFakeBridge } from '../src/services/fakes/bridge';
import { createFakeModel } from '../src/services/fakes/model';
import { createIntake } from '../src/services/intake';
import type { Channel, CapturedNotification } from '../src/core/types';

const messenger: Channel = {
  packageName: 'com.facebook.orca',
  label: 'Messenger',
  enabled: true,
  level: 1,
};
let db: Awaited<ReturnType<typeof testStore>>;
beforeEach(async () => {
  db = await testStore();
});
afterEach(() => db.close());

test('discovery preserves stored permissions; newly installed apps start off', async () => {
  await db.store.saveChannel({ ...messenger, level: 2 });
  const bridge = createFakeBridge();
  bridge.listNotifyingApps = async () => [
    { packageName: messenger.packageName, label: 'Messenger' },
    { packageName: 'new.app', label: 'New app' },
  ];
  const channels = await createChannelManager(db.store, bridge).discover();
  expect(
    channels.find(c => c.packageName === messenger.packageName),
  ).toMatchObject({ enabled: true, level: 2 });
  expect(channels.find(c => c.packageName === 'new.app')).toMatchObject({
    enabled: false,
    level: 1,
  });
});

test('saving enabled apps and levels syncs full list and persists across manager reload', async () => {
  const bridge = createFakeBridge();
  const sync = jest.spyOn(bridge, 'setEnabledPackages');
  const manager = createChannelManager(db.store, bridge);
  await manager.save(messenger);
  await manager.save({ ...messenger, level: 2 });
  expect(await db.store.getChannels()).toEqual([{ ...messenger, level: 2 }]);
  await manager.save({ ...messenger, enabled: false, level: 2 });
  expect(sync).toHaveBeenLastCalledWith([]);
  await createChannelManager(db.store, bridge).sync();
  expect(sync).toHaveBeenLastCalledWith([]);
});

test('native failure does not persist a permission change; retry can succeed', async () => {
  await db.store.saveChannel(messenger);
  const bridge = createFakeBridge();
  const sync = jest
    .spyOn(bridge, 'setEnabledPackages')
    .mockRejectedValueOnce(new Error('bridge down'));
  const manager = createChannelManager(db.store, bridge);
  await expect(
    manager.save({ ...messenger, enabled: false }),
  ).rejects.toThrow();
  expect((await db.store.getChannels())[0].enabled).toBe(true);
  await manager.save({ ...messenger, enabled: false });
  expect(sync).toHaveBeenLastCalledWith([]);
  expect((await db.store.getChannels())[0].enabled).toBe(false);
});

test('pending captured messages from disabled apps never reach SQLite or the model', async () => {
  await db.store.saveChannel({ ...messenger, enabled: false });
  const notification: CapturedNotification = {
    key: 'disabled',
    packageName: messenger.packageName,
    postedAt: Date.now(),
    title: 'Test sender',
    text: 'Can you send the report?',
    bigText: null,
    conversationTitle: null,
    isGroup: false,
    messages: [],
    category: 'msg',
    isOngoing: false,
    canReply: true,
  };
  const bridge = createFakeBridge([notification]);
  const model = createFakeModel();
  const extract = jest.spyOn(model, 'extract');
  await createIntake({ store: db.store, bridge, model }).drain();
  expect(await db.store.getMessagesByStatus('processed')).toEqual([]);
  expect(extract).not.toHaveBeenCalled();
});
