import type { Action, Chat, Draft, Message, MiraRecord } from '../../core/types';
import { migrate, type Row, type Scalar, type SqlDatabase } from './schema';
import { createStore } from './store';

/** The schema and queries run for real, on Node's built-in SQLite. */
function memoryDb(): SqlDatabase {
  const { DatabaseSync } = require('node:sqlite');
  const raw = new DatabaseSync(':memory:');
  const execute = async (sql: string, params: Scalar[] = []) => {
    const statement = raw.prepare(sql);
    if (statement.columns().length > 0) {
      return { rows: statement.all(...params) as Row[], rowsAffected: 0 };
    }
    return { rows: [], rowsAffected: Number(statement.run(...params).changes) };
  };
  return {
    execute,
    async transaction(fn) {
      raw.exec('BEGIN');
      try {
        await fn({ execute });
        raw.exec('COMMIT');
      } catch (error) {
        raw.exec('ROLLBACK');
        throw error;
      }
    },
  };
}

async function setup() {
  const db = memoryDb();
  await migrate(db);
  return { db, store: createStore(db) };
}

const chat: Chat = { id: 'orca:maya', packageName: 'com.facebook.orca', title: 'Maya Chen', kind: 'private' };

const message = (id: string, minute: number, text = 'Can we move our meeting to tomorrow?'): Message => ({
  id,
  notificationKey: `key-${id}`,
  packageName: chat.packageName,
  chatId: chat.id,
  sender: 'Maya Chen',
  text,
  postedAt: 1_000_000 + minute * 60_000,
  truncated: false,
  canReply: true,
  status: 'new',
});

const record = (messageId: string): MiraRecord => ({
  messageId,
  type: 'question',
  summary: 'Maya asks to move the meeting to tomorrow.',
  needsUser: true,
  urgency: 'normal',
  request: 'Move the meeting',
  amount: null,
  dateText: 'tomorrow',
  dateAt: 2_000_000,
  sensitive: false,
  instructionLike: false,
  duplicateOf: null,
});

describe('migrate', () => {
  it('creates the schema once and can run again safely', async () => {
    const { db } = await setup();
    await migrate(db);
    const { rows } = await db.execute('PRAGMA user_version');
    expect(Number(rows[0].user_version)).toBe(3);
  });
});

describe('store', () => {
  it('stores a message once and skips the same message again', async () => {
    const { store } = await setup();
    expect(await store.addMessage(message('m1', 0), chat)).toBe(true);
    // Same app, chat, sender, text, and time under a new id: still a duplicate.
    expect(await store.addMessage(message('m2', 0), chat)).toBe(false);
    expect(await store.getMessagesByStatus('new')).toHaveLength(1);
  });

  it('writes a record and the message status together and reads them back', async () => {
    const { store } = await setup();
    await store.addMessage(message('m1', 0), chat);
    await store.saveRecord(record('m1'), 'processed');

    const item = await store.getItem('m1');
    expect(item?.message.status).toBe('processed');
    expect(item?.chat).toEqual(chat);
    expect(item?.record).toEqual(record('m1'));
    expect(await store.getMessagesByStatus('new')).toHaveLength(0);
  });

  it('rolls back a write that fails partway', async () => {
    const { store } = await setup();
    // No message m9, so the record breaks its foreign key.
    await expect(store.saveRecord(record('m9'), 'processed')).rejects.toThrow();
    expect(await store.getItem('m9')).toBeNull();
  });

  it('lists a time range newest first, with unprocessed messages', async () => {
    const { store } = await setup();
    await store.addMessage(message('m1', 0, 'first'), chat);
    await store.addMessage(message('m2', 5, 'second'), chat);
    await store.addMessage(message('m3', 90, 'outside'), chat);
    await store.saveRecord(record('m1'), 'processed');

    const items = await store.getItems(1_000_000, 1_000_000 + 60 * 60_000);
    expect(items.map(i => i.message.id)).toEqual(['m2', 'm1']);
    expect(items[0].record).toBeNull();
  });

  it('keeps a draft first text when the user edits it', async () => {
    const { store } = await setup();
    await store.addMessage(message('m1', 0), chat);
    const draft: Draft = { id: 'd1', messageId: 'm1', text: 'Sure, 3pm?', firstText: 'Sure, 3pm?', status: 'waiting' };
    await store.addDraft(draft);
    await store.updateDraft('d1', { text: 'Sure, 4pm works.' });
    await store.updateDraft('d1', { status: 'approved' });

    expect(await store.getDrafts('waiting')).toEqual([]);
    expect(await store.getDrafts('approved')).toEqual([
      { ...draft, text: 'Sure, 4pm works.', status: 'approved' },
    ]);
  });

  it('pages the activity log newest first', async () => {
    const { store } = await setup();
    await store.addMessage(message('m1', 0), chat);
    for (let i = 1; i <= 3; i++) {
      const action: Action = {
        id: `a${i}`,
        ruleId: 'r1',
        messageId: 'm1',
        kind: 'remind',
        payload: { title: 'Meeting' },
        status: 'queued',
        reason: null,
        createdAt: i * 1000,
        doneAt: null,
      };
      await store.addAction(action);
    }
    await store.updateAction('a3', { status: 'done', doneAt: 5000 });

    const first = await store.getActions(undefined, 2);
    expect(first.map(a => a.id)).toEqual(['a3', 'a2']);
    expect(first[0]).toMatchObject({ status: 'done', doneAt: 5000, payload: { title: 'Meeting' } });
    expect((await store.getActions(first[1].createdAt, 2)).map(a => a.id)).toEqual(['a1']);
  });

  it('updates a channel in place', async () => {
    const { store } = await setup();
    await store.saveChannel({ packageName: chat.packageName, label: 'Messenger', enabled: true, level: 1 });
    await store.saveChannel({ packageName: chat.packageName, label: 'Messenger', enabled: false, level: 2 });
    expect(await store.getChannels()).toEqual([
      { packageName: chat.packageName, label: 'Messenger', enabled: false, level: 2 },
    ]);
  });

  it('deletes everything from one app together', async () => {
    const { db, store } = await setup();
    await store.addMessage(message('m1', 0), chat);
    await store.saveRecord(record('m1'), 'processed');
    await store.addDraft({ id: 'd1', messageId: 'm1', text: 'ok', firstText: 'ok', status: 'waiting' });

    await store.deleteAppData(chat.packageName);
    for (const table of ['messages', 'chats', 'records', 'drafts']) {
      const { rows } = await db.execute(`SELECT COUNT(*) AS n FROM ${table}`);
      expect([table, Number(rows[0].n)]).toEqual([table, 0]);
    }
  });

  it('tells subscribers after each write, until they unsubscribe', async () => {
    const { store } = await setup();
    const listener = jest.fn();
    const unsubscribe = store.subscribe(listener);
    await store.addMessage(message('m1', 0), chat);
    unsubscribe();
    await store.setMessageStatus('m1', 'filtered');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('keeps the words to keep messages by, and tells screens', async () => {
    const { store } = await setup();
    expect(await store.getKeepWords()).toEqual([]);
    const listener = jest.fn();
    store.subscribe(listener);
    await store.setKeepWords(['announcement', 'exam']);
    expect(await store.getKeepWords()).toEqual(['announcement', 'exam']);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('keeps preferences, replacing a value in place, without telling report subscribers', async () => {
    const { store } = await setup();
    const listener = jest.fn();
    store.subscribe(listener);
    await store.setPref('name', 'Alex');
    await store.setPref('name', 'Sam');
    await store.setPref('theme', 'dark');
    expect(await store.getPrefs()).toEqual({ name: 'Sam', theme: 'dark' });
    expect(listener).not.toHaveBeenCalled();
  });
});
