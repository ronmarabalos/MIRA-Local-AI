import { BUILTIN_RULES } from '../../core/builtinRules';
import type {
  Action,
  Channel,
  Chat,
  Draft,
  Message,
  MiraRecord,
  Rule,
} from '../../core/types';
import { createFakeBridge } from '../fakes/bridge';
import { createFakeModel } from '../fakes/model';
import type { StoredItem } from '../db';
import { type ActionStore, createActionRunner } from './index';

const NOW = new Date(2026, 9, 10, 9, 0).getTime();
const HOUR = 3_600_000;

const message: Message = {
  id: 'm1',
  notificationKey: 'n1',
  packageName: 'com.facebook.orca',
  chatId: 'c1',
  sender: 'Maya',
  text: 'Can we move the meeting to tomorrow?',
  postedAt: NOW,
  truncated: false,
  canReply: true,
  status: 'processed',
};
const chat: Chat = {
  id: 'c1',
  packageName: 'com.facebook.orca',
  title: 'Maya',
  kind: 'private',
};
const record: MiraRecord = {
  messageId: 'm1',
  type: 'question',
  summary: 'Maya asks to move the meeting.',
  needsUser: true,
  urgency: 'normal',
  request: null,
  amount: null,
  dateText: null,
  dateAt: null,
  sensitive: false,
  instructionLike: false,
  duplicateOf: null,
};
const item = (change: Partial<MiraRecord> = {}): StoredItem => ({
  message,
  chat,
  record: { ...record, ...change },
});

function setup(options: { level?: 1 | 2; rules?: Rule[] } = {}) {
  const actions: Action[] = [];
  const drafts: Draft[] = [];
  const channels: Channel[] = [
    {
      packageName: 'com.facebook.orca',
      label: 'Messenger',
      enabled: true,
      level: options.level ?? 2,
    },
  ];
  const rules =
    options.rules ?? BUILTIN_RULES.map(rule => ({ ...rule, enabled: true }));
  const store: ActionStore = {
    getRules: async () => rules,
    getChannels: async () => channels,
    getActions: async () => [...actions].reverse(),
    getActionsBetween: async (from, to) =>
      actions.filter(a => a.createdAt >= from && a.createdAt < to),
    addAction: async action => {
      actions.push({ ...action });
    },
    updateAction: async (id, change) => {
      const action = actions.find(a => a.id === id);
      if (action) {
        action.status = change.status;
        action.reason = change.reason ?? null;
        action.doneAt = change.doneAt ?? null;
      }
    },
    addDraft: async draft => {
      drafts.push({ ...draft });
    },
    updateDraft: async (id, change) => {
      const draft = drafts.find(d => d.id === id);
      if (draft) Object.assign(draft, change);
    },
    getDrafts: async status => drafts.filter(d => d.status === status),
    getItem: async () => item(),
  };
  const bridge = createFakeBridge([
    {
      key: 'n1',
      packageName: 'com.facebook.orca',
      postedAt: NOW,
      title: 'Maya',
      text: 'hi',
      bigText: null,
      conversationTitle: null,
      isGroup: false,
      messages: [],
      category: 'msg',
      isOngoing: false,
      canReply: true,
    },
  ]);
  const runner = createActionRunner({
    bridge,
    model: createFakeModel(),
    store,
    now: () => NOW,
  });
  return { runner, bridge, actions, drafts, channels };
}

describe('rules to actions', () => {
  test('a private question gets a draft waiting for approval, and nothing is sent', async () => {
    const { runner, bridge, actions, drafts } = setup();
    await runner.onRecord(item());
    expect(drafts).toHaveLength(1);
    expect(drafts[0]).toMatchObject({ messageId: 'm1', status: 'waiting' });
    expect(drafts[0].firstText).toBe(drafts[0].text);
    expect(actions).toMatchObject([
      { kind: 'draft', ruleId: 'builtin-draft', status: 'done' },
    ]);
    expect(bridge.sentReplies).toEqual([]);
  });

  test('a deadline with a date sets a reminder an hour before', async () => {
    const { runner, bridge, actions } = setup();
    await runner.onRecord(item({ type: 'deadline', dateAt: NOW + 5 * HOUR }));
    expect(bridge.reminders).toEqual([
      { title: record.summary, at: NOW + 4 * HOUR },
    ]);
    expect(actions).toMatchObject([
      { kind: 'remind', ruleId: 'builtin-remind', status: 'done' },
    ]);
  });

  test('a deadline with no date is logged as blocked, with the reason', async () => {
    const { runner, bridge, actions } = setup();
    await runner.onRecord(item({ type: 'deadline' }));
    expect(bridge.reminders).toEqual([]);
    expect(actions[0]).toMatchObject({
      status: 'blocked',
      reason: 'No date was found to remind you about.',
    });
  });

  test('a read-only channel logs the blocked draft and prepares none', async () => {
    const { runner, actions, drafts } = setup({ level: 1 });
    await runner.onRecord(item());
    expect(drafts).toEqual([]);
    expect(actions[0].status).toBe('blocked');
    expect(actions[0].reason).toMatch(/read and report/);
  });

  test('a hostile message causes nothing, and the log says why, even with every rule off', async () => {
    const { runner, bridge, actions, drafts } = setup({ rules: BUILTIN_RULES });
    await runner.onRecord(item({ instructionLike: true }));
    expect(drafts).toEqual([]);
    expect(bridge.reminders).toEqual([]);
    expect(bridge.sentReplies).toEqual([]);
    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({ status: 'blocked', ruleId: null });
    expect(actions[0].reason).toMatch(/instructions/);
  });

  test('a failed step is logged as failed, with the error', async () => {
    const { runner, bridge, actions } = setup();
    bridge.scheduleReminder = async () => {
      throw new Error('Reminders need permission to show notifications.');
    };
    await runner.onRecord(item({ type: 'deadline', dateAt: NOW + 5 * HOUR }));
    expect(actions[0]).toMatchObject({
      status: 'failed',
      reason: 'Reminders need permission to show notifications.',
    });
  });
});

describe('sending a draft', () => {
  async function withDraft(options?: Parameters<typeof setup>[0]) {
    const context = setup(options);
    await context.runner.onRecord(item());
    return { ...context, draftId: context.drafts[0].id };
  }

  test('online, the confirmed draft is sent and logged', async () => {
    const { runner, bridge, actions, drafts, draftId } = await withDraft();
    expect(await runner.sendDraft(draftId)).toBe('sent');
    expect(bridge.sentReplies).toEqual([{ key: 'n1', text: drafts[0].text }]);
    expect(drafts[0].status).toBe('sent');
    expect(actions.at(-1)).toMatchObject({ kind: 'send', status: 'done' });
  });

  test('offline, it is queued and nothing is sent; back online, the queue sends it', async () => {
    const { runner, bridge, actions, drafts, draftId } = await withDraft();
    bridge.setOnline(false);
    expect(await runner.sendDraft(draftId)).toBe('queued');
    expect(bridge.sentReplies).toEqual([]);
    expect(drafts[0].status).toBe('approved');
    expect(actions.at(-1)).toMatchObject({ kind: 'send', status: 'queued' });

    bridge.setOnline(true);
    await runner.flushQueue();
    expect(bridge.sentReplies).toHaveLength(1);
    expect(drafts[0].status).toBe('sent');
    expect(actions.at(-1)?.status).toBe('done');
  });

  test('a queued reply whose app was lowered to read-only needs the user instead', async () => {
    const { runner, bridge, actions, channels, draftId } = await withDraft();
    bridge.setOnline(false);
    await runner.sendDraft(draftId);
    channels[0].level = 1;
    bridge.setOnline(true);
    await runner.flushQueue();
    expect(bridge.sentReplies).toEqual([]);
    expect(actions.at(-1)).toMatchObject({ status: 'needs_you' });
  });

  test('when the notification is gone, the reply needs the user', async () => {
    const { runner, bridge, actions, draftId } = await withDraft();
    bridge.sendReply = async () => 'gone';
    expect(await runner.sendDraft(draftId)).toBe('needs_you');
    expect(actions.at(-1)?.reason).toMatch(/no longer showing/);
  });

  test('an unknown draft is not sent', async () => {
    const { runner, bridge } = setup();
    expect(await runner.sendDraft('missing')).toBe('needs_you');
    expect(bridge.sentReplies).toEqual([]);
  });
});
