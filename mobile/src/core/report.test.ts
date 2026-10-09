import { buildReport, type ReportItem } from './report';
import type { Action, MiraRecord, RecordType, Urgency } from './types';

const MESSENGER = 'com.facebook.orca';
const GMAIL = 'com.google.android.gm';

let next = 0;
function item(
  fields: Partial<MiraRecord> & { type: RecordType },
  opts: {
    packageName?: string;
    chatId?: string;
    minute?: number;
    status?: 'processed' | 'failed' | 'filtered' | 'new';
  } = {},
): ReportItem {
  const id = `m${++next}`;
  const packageName = opts.packageName ?? MESSENGER;
  const chatId = opts.chatId ?? `${packageName}:chat`;
  const status = opts.status ?? 'processed';
  return {
    message: {
      id,
      notificationKey: id,
      packageName,
      chatId,
      sender: 'Someone',
      text: 'text',
      postedAt: (opts.minute ?? next) * 60_000,
      truncated: false,
      canReply: true,
      status,
    },
    chat: { id: chatId, packageName, title: 'Chat', kind: 'private' },
    record:
      status === 'new'
        ? null
        : {
            messageId: id,
            summary: 'summary',
            needsUser: false,
            urgency: 'normal',
            request: null,
            amount: null,
            dateText: null,
            dateAt: null,
            sensitive: false,
            instructionLike: false,
            duplicateOf: null,
            ...fields,
          },
  };
}

const action = (
  messageId: string,
  status: Action['status'],
  kind: Action['kind'] = 'remind',
): Action => ({
  id: `a-${messageId}-${status}`,
  ruleId: 'r1',
  messageId,
  kind,
  payload: {},
  status,
  reason: null,
  createdAt: 0,
  doneAt: null,
});

const ids = (lines: { message: { id: string } }[]) =>
  lines.map(l => l.message.id);
const needs = (urgency: Urgency, minute: number) =>
  item({ type: 'request', needsUser: true, urgency }, { minute });

describe('buildReport', () => {
  it('lists what needs the user, most urgent first, newest first within a level', () => {
    const low = needs('low', 1);
    const highOld = needs('high', 2);
    const normal = needs('normal', 3);
    const highNew = needs('high', 4);
    const report = buildReport([low, highOld, normal, highNew], []);
    expect(ids(report.needsYou)).toEqual([
      highNew.message.id,
      highOld.message.id,
      normal.message.id,
      low.message.id,
    ]);
  });

  it('lists dates soonest first, including ones that also need the user', () => {
    const later = item({
      type: 'deadline',
      needsUser: true,
      dateText: 'Friday',
      dateAt: 9000,
    });
    const sooner = item({
      type: 'schedule_change',
      dateText: 'Monday',
      dateAt: 5000,
    });
    const unresolved = item({
      type: 'deadline',
      dateText: 'asap',
      dateAt: null,
    });
    const report = buildReport([later, sooner, unresolved], []);
    expect(ids(report.datesFound)).toEqual([
      sooner.message.id,
      later.message.id,
    ]);
    expect(ids(report.needsYou)).toEqual([later.message.id]);
  });

  it('lists announcements and schedule changes, newest first', () => {
    const a = item({ type: 'announcement' }, { minute: 1 });
    const b = item({ type: 'schedule_change' }, { minute: 2 });
    const q = item({ type: 'question' }, { minute: 3 });
    expect(ids(buildReport([a, b, q], []).announcements)).toEqual([
      b.message.id,
      a.message.id,
    ]);
  });

  it('counts promotions and chatter instead of listing them', () => {
    const report = buildReport(
      [
        item({ type: 'promotion' }, { status: 'filtered' }),
        item({ type: 'chatter' }, { status: 'filtered' }),
        item({ type: 'chatter', needsUser: true }),
      ],
      [],
    );
    expect(report.ignored).toBe(3);
    expect(report.needsYou).toEqual([]);
  });

  it('lists messages the model could not read, and counts ones still waiting', () => {
    const failed = item({ type: 'other' }, { status: 'failed' });
    const waiting = item({ type: 'other' }, { status: 'new' });
    const report = buildReport([failed, waiting], []);
    expect(ids(report.couldNotRead)).toEqual([failed.message.id]);
    expect(report.waiting).toBe(1);
    expect(report.needsYou).toEqual([]);
  });

  it('keeps messages that try to give instructions out of Needs you and Dates found', () => {
    const hostile = item({
      type: 'other',
      needsUser: true,
      instructionLike: true,
      dateAt: 5000,
      dateText: 'now',
    });
    const report = buildReport([hostile], []);
    expect(report.needsYou).toEqual([]);
    expect(report.datesFound).toEqual([]);
  });

  it('leaves out records linked to an earlier copy', () => {
    const first = item({ type: 'announcement' });
    const copy = item({ type: 'announcement', duplicateOf: first.message.id });
    expect(ids(buildReport([first, copy], []).announcements)).toEqual([
      first.message.id,
    ]);
  });

  it('shows completed and queued actions as handled, with their message', () => {
    const m = item({ type: 'deadline' });
    const report = buildReport(
      [m],
      [
        action(m.message.id, 'done'),
        action(m.message.id, 'queued', 'send'),
        action(m.message.id, 'failed'),
        action(m.message.id, 'blocked'),
        action(m.message.id, 'undone'),
      ],
    );
    expect(report.handled.map(h => h.action.status)).toEqual([
      'done',
      'queued',
    ]);
    expect(report.handled[0].item?.message.id).toBe(m.message.id);
  });

  it('narrows every section to one app or one chat', () => {
    const gmail = item(
      { type: 'request', needsUser: true },
      { packageName: GMAIL },
    );
    const chatA = item(
      { type: 'request', needsUser: true },
      { chatId: 'orca:a' },
    );
    const chatB = item({ type: 'promotion' }, { chatId: 'orca:b' });
    const all = [gmail, chatA, chatB];
    const actions = [
      action(gmail.message.id, 'done'),
      action(chatA.message.id, 'done'),
    ];

    const byApp = buildReport(all, actions, {
      kind: 'app',
      packageName: GMAIL,
    });
    expect(ids(byApp.needsYou)).toEqual([gmail.message.id]);
    expect(byApp.handled.map(h => h.action.messageId)).toEqual([
      gmail.message.id,
    ]);
    expect(byApp.ignored).toBe(0);

    const byChat = buildReport(all, actions, {
      kind: 'chat',
      chatId: 'orca:b',
    });
    expect(byChat.needsYou).toEqual([]);
    expect(byChat.handled).toEqual([]);
    expect(byChat.ignored).toBe(1);
  });
});

test('a repeated message is one line that says how often and in how many chats it was seen', () => {
  const original = item(
    { type: 'request', needsUser: true },
    { chatId: 'chat-a' },
  );
  const sameChat = item(
    { type: 'request', needsUser: true, duplicateOf: original.message.id },
    { chatId: 'chat-a' },
  );
  const otherChat = item(
    { type: 'request', needsUser: true, duplicateOf: original.message.id },
    { chatId: 'chat-b' },
  );
  const alone = item({ type: 'request', needsUser: true });

  const report = buildReport([original, sameChat, otherChat, alone], []);
  expect(report.needsYou).toHaveLength(2);
  const line = report.needsYou.find(l => l.message.id === original.message.id);
  expect(line?.seen).toEqual({ times: 3, chats: 2 });
  expect(
    report.needsYou.find(l => l.message.id === alone.message.id)?.seen,
  ).toBeUndefined();
});
