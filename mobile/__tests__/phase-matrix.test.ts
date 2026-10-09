import { testStore } from '../test-support/sqlite';
import { createIntake } from '../src/services/intake';
import { createFakeBridge } from '../src/services/fakes/bridge';
import { createFakeModel } from '../src/services/fakes/model';
import { buildReport } from '../src/core/report';
import type { CapturedNotification } from '../src/core/types';

test('Phase 2 matrix reaches the real database/report and excludes a disabled source', async () => {
  const { store, close } = await testStore();
  try {
    const postedAt = Date.now();
    const sources = ['com.facebook.orca', 'com.google.android.gm'];
    for (const packageName of sources)
      await store.saveChannel({
        packageName,
        label: packageName,
        enabled: true,
        level: 1,
      });
    const messages = [
      'Class has moved to room 204.',
      'Please pay PHP 450 by tomorrow.',
      'Can you send me the report?',
      'Half price sale today only.',
      'This disabled message must be absent.',
    ];
    const notifications: CapturedNotification[] = messages.map((text, i) => ({
      key: `matrix-${i}`,
      packageName: i === 4 ? 'disabled.app' : sources[i % 2],
      postedAt: postedAt + i,
      title: 'Synthetic sender',
      text,
      bigText: null,
      conversationTitle: null,
      isGroup: false,
      messages: [],
      category: i === 3 ? 'promo' : 'msg',
      isOngoing: false,
      canReply: true,
    }));
    const model = createFakeModel({
      [messages[0]]: { type: 'announcement' },
      [messages[1]]: {
        type: 'payment',
        needs_user: true,
        amount: 'PHP 450',
        date_text: 'tomorrow',
      },
      [messages[2]]: { type: 'question', needs_user: true },
    });
    const extract = jest.spyOn(model, 'extract');
    await createIntake({
      store,
      bridge: createFakeBridge(notifications),
      model,
    }).drain();
    const items = await store.getItems(postedAt, postedAt + 10);
    expect(items).toHaveLength(4);
    expect(items.some(i => i.message.packageName === 'disabled.app')).toBe(
      false,
    );
    expect(extract).toHaveBeenCalledTimes(3);
    const report = buildReport(items, []);
    expect(report.announcements).toHaveLength(1);
    expect(report.needsYou).toHaveLength(2);
    expect(report.ignored).toBe(1);
  } finally {
    close();
  }
});

test('privacy counts the complete day and averages only recorded successful durations', async () => {
  const { store, close } = await testStore();
  try {
    await store.addMessage(
      {
        id: 'metrics',
        notificationKey: 'metrics',
        packageName: 'test.app',
        chatId: 'metrics-chat',
        sender: 'Fixture',
        text: 'Synthetic metric message',
        postedAt: 100,
        truncated: false,
        canReply: false,
        status: 'processed',
      },
      {
        id: 'metrics-chat',
        packageName: 'test.app',
        title: 'Fixtures',
        kind: 'private',
      },
    );
    expect(await store.getProcessingStats(0, 200)).toMatchObject({
      processed: 1,
      averageMs: null,
    });
    await store.saveProcessingTime('metrics', 250);
    expect(await store.getProcessingStats(0, 200)).toMatchObject({
      processed: 1,
      averageMs: 250,
    });
    expect(await store.getProcessingStats(200, 300)).toMatchObject({
      processed: 0,
      averageMs: null,
    });
    await expect(store.saveProcessingTime('metrics', -2)).rejects.toThrow();
    await store.deleteAppData('test.app');
    expect(await store.getProcessingStats(0, 200)).toMatchObject({
      processed: 0,
      averageMs: null,
    });
  } finally {
    close();
  }
});
