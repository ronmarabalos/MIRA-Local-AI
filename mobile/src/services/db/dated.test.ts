import { testStore } from '../../../test-support/sqlite';

test('getDatedItems returns only messages with a date phrase, however many newer undated ones there are', async () => {
  const { store, close } = await testStore();
  const chat = {
    id: 'c1',
    packageName: 'com.facebook.orca',
    title: 'Chat',
    kind: 'private' as const,
  };
  const add = async (id: string, postedAt: number, dateText: string | null) => {
    await store.addMessage(
      {
        id,
        notificationKey: id,
        packageName: 'com.facebook.orca',
        chatId: 'c1',
        sender: 'Carla',
        text: `text ${id}`,
        postedAt,
        truncated: false,
        canReply: true,
        status: 'processed',
      },
      chat,
    );
    await store.saveRecord(
      {
        messageId: id,
        type: 'deadline',
        summary: id,
        needsUser: true,
        urgency: 'normal',
        request: null,
        amount: null,
        dateText,
        dateAt: null,
        sensitive: false,
        instructionLike: false,
        duplicateOf: null,
      },
      'processed',
    );
  };
  await add('old-dated', 1_000, 'oct 20');
  for (let i = 0; i < 5; i += 1) await add(`chat-${i}`, 2_000 + i, null);
  await add('new-dated', 9_000, 'Friday');

  // A limit of 2 on all items would return only the two newest, both undated but one.
  const dated = await store.getDatedItems(0, 10_000, 2);
  expect(dated.map(item => item.message.id)).toEqual([
    'new-dated',
    'old-dated',
  ]);
  expect(dated.every(item => item.record?.dateText !== null)).toBe(true);
  close();
});
