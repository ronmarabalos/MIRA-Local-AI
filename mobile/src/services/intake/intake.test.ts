import { FIXTURES } from '../../core/__fixtures__/messages';
import type {
  CapturedNotification,
  Chat,
  Message,
  MiraRecord,
} from '../../core/types';
import { createFakeBridge } from '../fakes/bridge';
import { createFakeModel } from '../fakes/model';
import type { StoredItem } from '../db';
import { createIntake, type IntakeStore } from './index';
import { splitNotification } from './split';

const fixture = (id: string): CapturedNotification => {
  const found = FIXTURES.find(f => f.id === id);
  if (!found) throw new Error(`No fixture ${id}`);
  return found.notification;
};

/** A store in memory with the same identity rule as the real one. */
function memoryStore() {
  const messages = new Map<string, Message>();
  const chats = new Map<string, Chat>();
  const records = new Map<string, MiraRecord>();
  const identity = (m: Message) =>
    [m.packageName, m.chatId, m.sender, m.text, m.postedAt].join('|');
  const store: IntakeStore = {
    async saveProcessingTime() {},
    async getChannels() {
      return [...new Set(FIXTURES.map(f => f.notification.packageName))].map(
        packageName => ({
          packageName,
          label: packageName,
          enabled: true,
          level: 1 as const,
        }),
      );
    },
    async addMessage(message, chat) {
      if ([...messages.values()].some(m => identity(m) === identity(message)))
        return false;
      messages.set(message.id, { ...message });
      chats.set(chat.id, chat);
      return true;
    },
    async saveRecord(record, status) {
      records.set(record.messageId, record);
      const message = messages.get(record.messageId);
      if (message) message.status = status;
    },
    async getMessagesByStatus(status) {
      return [...messages.values()].filter(m => m.status === status);
    },
    async getItems(from, to) {
      return [...messages.values()]
        .filter(m => m.postedAt >= from && m.postedAt < to)
        .map(m => ({
          message: m,
          chat: chats.get(m.chatId)!,
          record: records.get(m.id) ?? null,
        }));
    },
    async getItem(messageId) {
      const message = messages.get(messageId);
      const chat = message && chats.get(message.chatId);
      return message && chat
        ? { message, chat, record: records.get(messageId) ?? null }
        : null;
    },
  };
  return { store, messages, records };
}

describe('splitNotification', () => {
  const group: CapturedNotification = {
    key: 'k',
    packageName: 'com.facebook.orca',
    postedAt: 300,
    title: 'gg',
    text: 'Pat: third message here',
    bigText: null,
    conversationTitle: 'gg',
    isGroup: true,
    messages: [
      { sender: 'Pat', text: 'first message here', time: 100 },
      { sender: 'Ana', text: 'second message here', time: 200 },
      { sender: 'Pat', text: 'third message here', time: 300 },
    ],
    category: 'msg',
    isOngoing: false,
    canReply: true,
  };

  test('a group notification becomes one message per listed message, sender kept apart', () => {
    const parts = splitNotification(group);
    expect(
      parts.map(p => [p.message.sender, p.message.text, p.message.postedAt]),
    ).toEqual([
      ['Pat', 'first message here', 100],
      ['Ana', 'second message here', 200],
      ['Pat', 'third message here', 300],
    ]);
    expect(parts[0].chat).toEqual({
      id: 'com.facebook.orca:gg',
      packageName: 'com.facebook.orca',
      title: 'gg',
      kind: 'group',
    });
  });

  test('the same message gets the same id when the notification is posted again', () => {
    const first = splitNotification(group).map(p => p.message.id);
    const again = splitNotification({ ...group, key: 'k2', postedAt: 999 }).map(
      p => p.message.id,
    );
    expect(again).toEqual(first);
    expect(new Set(first).size).toBe(3);
  });

  test('a group notification with no message list has the sender taken off its text', () => {
    const [part] = splitNotification({ ...group, messages: [] });
    expect([part.message.sender, part.message.text]).toEqual([
      'Pat',
      'third message here',
    ]);
  });

  test('an email is one message from its title, using the expanded text', () => {
    const [part] = splitNotification({
      ...group,
      packageName: 'com.google.android.gm',
      title: 'University Cashier',
      conversationTitle: null,
      isGroup: false,
      messages: [],
      text: 'Tuition balance',
      bigText: 'Tuition balance of PHP 12,500 is due on October 15.',
    });
    expect(part.message.sender).toBe('University Cashier');
    expect(part.message.text).toBe(
      'Tuition balance of PHP 12,500 is due on October 15.',
    );
    expect(part.chat.kind).toBe('private');
  });

  test('a notification with no text gives no messages', () => {
    expect(splitNotification({ ...group, messages: [], text: null })).toEqual(
      [],
    );
  });
});

describe('intake', () => {
  test('a message that needs the model is stored with a verified record', async () => {
    const notification = fixture('proposal-due');
    const text = notification.messages[0].text;
    const { store, messages, records } = memoryStore();
    const intake = createIntake({
      bridge: createFakeBridge([notification]),
      model: createFakeModel({
        [text]: {
          type: 'deadline',
          needs_user: true,
          date_text: 'not in the message',
        },
      }),
      store,
    });
    await intake.drain();
    const [message] = [...messages.values()];
    expect(message.status).toBe('processed');
    const record = records.get(message.id);
    expect(record?.type).toBe('deadline');
    // The verifier clears a date phrase the message does not contain.
    expect(record?.dateText).toBeNull();
  });

  test('chatter is stored without calling the model; dropped notifications are not stored', async () => {
    const extract = jest.fn();
    const { store, messages, records } = memoryStore();
    const dropped = {
      ...fixture('chatter-reaction'),
      key: 'ongoing',
      isOngoing: true,
    };
    const intake = createIntake({
      bridge: createFakeBridge([fixture('chatter-reaction'), dropped]),
      model: { extract },
      store,
    });
    await intake.drain();
    expect(extract).not.toHaveBeenCalled();
    expect(messages.size).toBe(1);
    const [message] = [...messages.values()];
    expect(message.status).toBe('filtered');
    expect(records.get(message.id)?.type).toBe('chatter');
  });

  test('a message already stored is skipped when its notification arrives again', async () => {
    const notification = fixture('proposal-due');
    const bridge = createFakeBridge([notification]);
    const extract = jest.fn(createFakeModel().extract);
    const { store, messages } = memoryStore();
    const intake = createIntake({ bridge, model: { extract }, store });
    await intake.drain();
    bridge.push({ ...notification, key: 'posted-again' });
    await intake.drain();
    expect(messages.size).toBe(1);
    expect(extract).toHaveBeenCalledTimes(1);
  });

  test('a message the model fails on twice is stored as failed', async () => {
    const extract = jest.fn().mockRejectedValue(new Error('unreadable'));
    const { store, messages, records } = memoryStore();
    const intake = createIntake({
      bridge: createFakeBridge([fixture('proposal-due')]),
      model: { extract },
      store,
    });
    await intake.drain();
    expect(extract).toHaveBeenCalledTimes(2);
    const [message] = [...messages.values()];
    expect(message.status).toBe('failed');
    expect(records.get(message.id)?.type).toBe('other');
  });

  test('a message left unprocessed by an earlier session is picked up', async () => {
    const { store, messages } = memoryStore();
    const [{ message, chat }] = splitNotification(fixture('proposal-due'));
    await store.addMessage(message, chat);
    const intake = createIntake({
      bridge: createFakeBridge(),
      model: createFakeModel(),
      store,
    });
    await intake.drain();
    expect(messages.get(message.id)?.status).toBe('processed');
  });

  test('a notification arriving during a run is handled before drain resolves', async () => {
    const bridge = createFakeBridge([fixture('proposal-due')]);
    const { store, messages } = memoryStore();
    const intake = createIntake({ bridge, model: createFakeModel(), store });
    const first = intake.drain();
    bridge.push(fixture('lab-report'));
    await Promise.all([first, intake.drain()]);
    expect(messages.size).toBe(2);
    expect([...messages.values()].every(m => m.status === 'processed')).toBe(
      true,
    );
  });

  test('a message the model read is handed on for rules; a filtered one is not', async () => {
    const onProcessed = jest.fn(async (_item: StoredItem) => {});
    const { store } = memoryStore();
    const intake = createIntake({
      bridge: createFakeBridge([
        fixture('proposal-due'),
        fixture('chatter-reaction'),
      ]),
      model: createFakeModel(),
      store,
      onProcessed,
    });
    await intake.drain();
    expect(onProcessed).toHaveBeenCalledTimes(1);
    expect(onProcessed.mock.calls[0][0].record?.messageId).toBe(
      onProcessed.mock.calls[0][0].message.id,
    );
  });

  test('a failure while applying rules does not stop the next message', async () => {
    const { store, messages } = memoryStore();
    const intake = createIntake({
      bridge: createFakeBridge([
        fixture('proposal-due'),
        fixture('lab-report'),
      ]),
      model: createFakeModel(),
      store,
      onProcessed: async () => {
        throw new Error('rule failed');
      },
    });
    await intake.drain();
    expect([...messages.values()].map(m => m.status)).toEqual([
      'processed',
      'processed',
    ]);
  });

  test('the same message sent twice is read once, and the copy is linked to the first', async () => {
    const first = fixture('proposal-due');
    const again = {
      ...first,
      key: 'sent-again',
      postedAt: first.postedAt + 60_000,
      messages: first.messages.map(m => ({ ...m, time: m.time + 60_000 })),
    };
    const extract = jest.fn(createFakeModel().extract);
    const onProcessed = jest.fn(async (_item: StoredItem) => {});
    const { store, messages, records } = memoryStore();
    const intake = createIntake({
      bridge: createFakeBridge([first, again]),
      model: { extract },
      store,
      onProcessed,
    });
    await intake.drain();

    const [original, copy] = [...messages.values()].sort(
      (a, b) => a.postedAt - b.postedAt,
    );
    expect(extract).toHaveBeenCalledTimes(1);
    expect(onProcessed).toHaveBeenCalledTimes(1);
    expect(records.get(original.id)?.duplicateOf).toBeNull();
    expect(records.get(copy.id)?.duplicateOf).toBe(original.id);
    expect(copy.status).toBe('processed');
  });

  test('copies stored before duplicates were recognised are linked on the next run', async () => {
    const { store, messages, records } = memoryStore();
    const now = Date.now();
    const [first] = splitNotification(fixture('proposal-due'));
    const original = {
      ...first.message,
      id: 'old-1',
      postedAt: now - 120_000,
      status: 'processed' as const,
    };
    const copy = {
      ...first.message,
      id: 'old-2',
      postedAt: now - 60_000,
      status: 'processed' as const,
    };
    for (const message of [original, copy]) {
      await store.addMessage(message, first.chat);
      await store.saveRecord(
        {
          messageId: message.id,
          type: 'deadline',
          summary: 'Proposal due.',
          needsUser: true,
          urgency: 'normal',
          request: null,
          amount: null,
          dateText: null,
          dateAt: null,
          sensitive: false,
          instructionLike: false,
          duplicateOf: null,
        },
        'processed',
      );
    }
    const intake = createIntake({
      bridge: createFakeBridge(),
      model: createFakeModel(),
      store,
    });
    await intake.drain();
    expect(records.get('old-1')?.duplicateOf).toBeNull();
    expect(records.get('old-2')?.duplicateOf).toBe('old-1');
    expect(messages.size).toBe(2);
  });
});
