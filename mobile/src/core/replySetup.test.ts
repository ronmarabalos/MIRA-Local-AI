import { BUILTIN_RULES } from './builtinRules';
import type { ReportItem } from './report';
import { draftRuleFor, messagesToDraft, setupFromRule } from './replySetup';
import type { RecordType } from './types';

const base = BUILTIN_RULES.find(r => r.id === 'builtin-draft')!;
const NOW = new Date(2026, 9, 10, 15).getTime();

let next = 0;
function item(
  type: RecordType,
  opts: { kind?: 'private' | 'group'; app?: string; hoursAgo?: number; canReply?: boolean; hostile?: boolean } = {},
): ReportItem {
  const id = `m${++next}`;
  return {
    message: {
      id,
      notificationKey: id,
      packageName: opts.app ?? 'com.facebook.orca',
      chatId: 'c1',
      sender: 'Ana',
      text: 'hello',
      postedAt: NOW - (opts.hoursAgo ?? 1) * 3_600_000,
      truncated: false,
      canReply: opts.canReply ?? true,
      status: 'processed',
    },
    chat: { id: 'c1', packageName: opts.app ?? 'com.facebook.orca', title: 'Ana', kind: opts.kind ?? 'private' },
    record: {
      messageId: id,
      type,
      summary: 'x',
      needsUser: true,
      urgency: 'normal',
      request: null,
      amount: null,
      dateText: null,
      dateAt: null,
      sensitive: false,
      instructionLike: opts.hostile ?? false,
      duplicateOf: null,
    },
  };
}

describe('draftRuleFor', () => {
  test('turns the answers into the draft rule, switched on, prepare only', () => {
    const rule = draftRuleFor(base, { kinds: ['question', 'request'], groups: true });
    expect(rule.enabled).toBe(true);
    expect(rule.definition.if.types).toEqual(['question', 'request']);
    expect(rule.definition.if.chat_kind).toBe('any');
    expect(rule.definition.then.action).toBe('draft');
    expect(rule.definition.level).toBe('prepare');
    expect(rule.id).toBe('builtin-draft');
  });

  test('private chats only, unless group chats were chosen', () => {
    expect(draftRuleFor(base, { kinds: ['question'], groups: false }).definition.if.chat_kind).toBe('private');
  });

  test('reads back as the same answers', () => {
    expect(setupFromRule(draftRuleFor(base, { kinds: ['request'], groups: true }))).toEqual({
      kinds: ['request'],
      groups: true,
    });
    expect(setupFromRule(base)).toEqual({ kinds: ['question'], groups: false });
  });
});

describe('messagesToDraft', () => {
  const setup = { kinds: ['question' as const], groups: false };
  const apps = ['com.facebook.orca'];

  test("picks today's messages of the chosen kinds, in the chosen apps", () => {
    const ask = item('question');
    const promo = item('promotion');
    const otherApp = item('question', { app: 'com.whatsapp' });
    const group = item('question', { kind: 'group' });
    const old = item('question', { hoursAgo: 30 });
    expect(messagesToDraft([ask, promo, otherApp, group, old], setup, apps, NOW)).toEqual([ask]);
  });

  test('never a message that cannot be answered or tries to give instructions', () => {
    const closed = item('question', { canReply: false });
    const hostile = item('question', { hostile: true });
    expect(messagesToDraft([closed, hostile], setup, apps, NOW)).toEqual([]);
  });

  test('group chats count when chosen', () => {
    const group = item('question', { kind: 'group' });
    expect(messagesToDraft([group], { ...setup, groups: true }, apps, NOW)).toEqual([group]);
  });
});
