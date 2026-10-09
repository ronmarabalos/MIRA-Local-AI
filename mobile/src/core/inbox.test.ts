import { buildInbox, labelLine } from './inbox';
import type { ReportItem } from './report';
import type { MiraRecord } from './types';

const MESSENGER = 'com.facebook.orca';
const GMAIL = 'com.google.android.gm';

let next = 0;
function item(
  record: Partial<MiraRecord> = {},
  opts: {
    packageName?: string;
    chatId?: string;
    minute?: number;
    status?: 'processed' | 'filtered' | 'failed' | 'new';
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
      sender: 'Carla',
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
            type: 'request',
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
            ...record,
          },
  };
}

const all = { filter: 'all' as const, packageName: null };
const ids = (items: ReportItem[]) => items.map(i => i.message.id);

describe('buildInbox', () => {
  test('lists every message newest first', () => {
    const older = item({}, { minute: 1 });
    const newer = item({}, { minute: 5 });
    expect(ids(buildInbox([older, newer], all).rows)).toEqual(
      ids([newer, older]),
    );
  });

  test('each filter holds the right messages, and the counts cover all four at once', () => {
    const needs = item({ needsUser: true });
    const dated = item({ type: 'deadline', dateText: 'oct 12' });
    const both = item({ type: 'payment', needsUser: true, dateText: 'Friday' });
    const chatter = item({ type: 'chatter' }, { status: 'filtered' });
    const promo = item({ type: 'promotion' }, { status: 'filtered' });
    const plain = item();
    const items = [needs, dated, both, chatter, promo, plain];

    const rows = (filter: 'all' | 'needs' | 'dated' | 'ignored') =>
      ids(buildInbox(items, { filter, packageName: null }).rows).sort();
    expect(rows('needs')).toEqual(ids([needs, both]).sort());
    expect(rows('dated')).toEqual(ids([dated, both]).sort());
    expect(rows('ignored')).toEqual(ids([chatter, promo]).sort());
    expect(rows('all')).toHaveLength(6);
    expect(buildInbox(items, all).counts).toEqual({
      all: 6,
      needs: 2,
      dated: 2,
      ignored: 2,
    });
  });

  test('a message that tried to give instructions is only under All', () => {
    const hostile = item({
      needsUser: true,
      dateText: 'today',
      instructionLike: true,
    });
    const inbox = (filter: 'all' | 'needs' | 'dated') =>
      buildInbox([hostile], { filter, packageName: null }).rows;
    expect(inbox('all')).toHaveLength(1);
    expect(inbox('needs')).toEqual([]);
    expect(inbox('dated')).toEqual([]);
  });

  test('a message still being read, or one that could not be read, is only under All', () => {
    const reading = item({}, { status: 'new' });
    const failed = item(
      { needsUser: true, dateText: 'x' },
      { status: 'failed' },
    );
    expect(buildInbox([reading, failed], all).counts).toEqual({
      all: 2,
      needs: 0,
      dated: 0,
      ignored: 0,
    });
  });

  test('a copy is not a row; the first message says how often it was seen', () => {
    const first = item({ needsUser: true }, { chatId: 'a' });
    const sameChat = item(
      { needsUser: true, duplicateOf: first.message.id },
      { chatId: 'a' },
    );
    const otherChat = item(
      { needsUser: true, duplicateOf: first.message.id },
      { chatId: 'b' },
    );
    const inbox = buildInbox([first, sameChat, otherChat], all);
    expect(ids(inbox.rows)).toEqual([first.message.id]);
    expect(inbox.rows[0].seen).toEqual({ times: 3, chats: 2 });
    expect(inbox.counts.all).toBe(1);
  });

  test('apps are listed most first, and choosing one narrows the rows and the counts', () => {
    const a = item({ needsUser: true });
    const b = item();
    const mail = item({ needsUser: true }, { packageName: GMAIL });
    const items = [a, b, mail];
    expect(buildInbox(items, all).apps).toEqual([
      { packageName: MESSENGER, count: 2 },
      { packageName: GMAIL, count: 1 },
    ]);
    const onlyMail = buildInbox(items, { filter: 'all', packageName: GMAIL });
    expect(ids(onlyMail.rows)).toEqual([mail.message.id]);
    expect(onlyMail.counts).toEqual({ all: 1, needs: 1, dated: 0, ignored: 0 });
    // The app list itself does not shrink, so the other pills stay available.
    expect(onlyMail.apps).toHaveLength(2);
  });

  test('with nothing stored there are no rows, zero counts, and no apps', () => {
    expect(buildInbox([], all)).toEqual({
      rows: [],
      counts: { all: 0, needs: 0, dated: 0, ignored: 0 },
      apps: [],
    });
  });
});

describe('labelLine', () => {
  test('a read message shows its type, whether it needs you, its date phrase, and the time', () => {
    expect(
      labelLine(
        item({ type: 'deadline', needsUser: true, dateText: 'oct 12' }),
        '5:08 AM',
      ),
    ).toBe('Deadline · Needs you · oct 12 · 5:08 AM');
    expect(labelLine(item({ type: 'schedule_change' }), '5:08 AM')).toBe(
      'Schedule change · 5:08 AM',
    );
  });

  test('each other state has its own line', () => {
    expect(
      labelLine(item({ type: 'chatter' }, { status: 'filtered' }), '5:08 AM'),
    ).toBe('Ignored · Chatter · 5:08 AM');
    expect(
      labelLine(item({ needsUser: true, instructionLike: true }), '5:08 AM'),
    ).toBe('Blocked · 5:08 AM');
    expect(labelLine(item({}, { status: 'new' }), '5:08 AM')).toBe(
      'Reading… · 5:08 AM',
    );
    expect(labelLine(item({}, { status: 'failed' }), '5:08 AM')).toBe(
      'Couldn’t read · 5:08 AM',
    );
  });
});
