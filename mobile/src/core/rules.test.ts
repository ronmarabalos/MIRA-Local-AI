import { BUILTIN_RULES } from './builtinRules';
import { decide, type RuleInput } from './rules';
import type { Chat, Message, MiraRecord, Rule } from './types';

const message: Message = {
  id: 'm1',
  notificationKey: 'n1',
  packageName: 'com.facebook.orca',
  chatId: 'c1',
  sender: 'Maya',
  text: 'Can we move the meeting to tomorrow?',
  postedAt: 1_000,
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

const rule = (
  id: string,
  change: Partial<Rule['definition']> = {},
  enabled = true,
): Rule => {
  const definition: Rule['definition'] = {
    when: 'message',
    if: { types: ['question'] },
    then: { action: 'draft', params: {} },
    level: 'prepare',
    limits: { daily_cap: 5 },
    ...change,
  };
  return {
    id,
    sentence: id,
    definition,
    level: definition.level,
    enabled,
    createdAt: 0,
  };
};

const input = (change: Partial<RuleInput> = {}): RuleInput => ({
  record,
  message,
  chat,
  rules: [rule('draft')],
  channelLevel: 2,
  autoActionsToday: 0,
  actionsTodayByRule: {},
  ...change,
});

describe('matching', () => {
  test('a matching rule at prepare level prepares its action', () => {
    expect(decide(input())).toEqual([
      { outcome: 'prepare', action: 'draft', ruleId: 'draft', reason: null },
    ]);
  });

  test('a rule that is switched off, or whose conditions do not hold, decides nothing', () => {
    expect(decide(input({ rules: [rule('off', {}, false)] }))).toEqual([]);
    expect(
      decide(input({ rules: [rule('type', { if: { types: ['payment'] } })] })),
    ).toEqual([]);
    expect(
      decide(input({ rules: [rule('app', { if: { apps: ['com.other'] } })] })),
    ).toEqual([]);
    expect(
      decide(input({ rules: [rule('kind', { if: { chat_kind: 'group' } })] })),
    ).toEqual([]);
    expect(
      decide(
        input({ rules: [rule('who', { if: { senders: ['Prof. Reyes'] } })] }),
      ),
    ).toEqual([]);
    expect(
      decide(
        input({ rules: [rule('word', { if: { contains: ['tuition'] } })] }),
      ),
    ).toEqual([]);
    expect(
      decide(
        input({ rules: [rule('urgent', { if: { urgency_min: 'high' } })] }),
      ),
    ).toEqual([]);
  });

  test('conditions match without regard to letter case, and "any" chat kind matches both', () => {
    const decisions = decide(
      input({
        rules: [
          rule('r', {
            if: { senders: ['maya'], contains: ['MEETING'], chat_kind: 'any' },
          }),
        ],
      }),
    );
    expect(decisions).toHaveLength(1);
  });

  test('an observe rule only watches: it decides nothing', () => {
    expect(
      decide(input({ rules: [rule('watch', { level: 'observe' })] })),
    ).toEqual([]);
  });

  test('an act rule does a local action', () => {
    const remind = rule('remind', {
      then: { action: 'remind', params: {} },
      level: 'act',
    });
    expect(decide(input({ rules: [remind] }))[0]).toMatchObject({
      outcome: 'do',
      action: 'remind',
    });
  });
});

describe('hard limits (spec 4.8)', () => {
  test('1. no decision exceeds the channel level: drafts are blocked on a read-only channel', () => {
    const [decision] = decide(input({ channelLevel: 1 }));
    expect(decision.outcome).toBe('blocked');
    expect(decision.reason).toMatch(/read and report/i);
  });

  test('1. local actions are still allowed on a read-only channel', () => {
    const remind = rule('remind', {
      then: { action: 'remind', params: {} },
      level: 'act',
    });
    expect(decide(input({ channelLevel: 1, rules: [remind] }))[0].outcome).toBe(
      'do',
    );
  });

  test('2. a reply is never done automatically: a draft rule set to act only prepares', () => {
    const [decision] = decide(
      input({ rules: [rule('eager', { level: 'act' })] }),
    );
    expect(decision).toMatchObject({ outcome: 'prepare', action: 'draft' });
  });

  test('3. a sensitive message never gets an automatic draft', () => {
    const [decision] = decide(
      input({ record: { ...record, sensitive: true } }),
    );
    expect(decision.outcome).toBe('blocked');
    expect(decision.reason).toMatch(/sensitive/i);
  });

  test('4. no draft is prepared for a group chat unless the user asks', () => {
    const group: Chat = { ...chat, kind: 'group' };
    const rules = [
      rule('any', { if: { types: ['question'], chat_kind: 'any' } }),
    ];
    expect(decide(input({ chat: group, rules }))[0].outcome).toBe('blocked');
    expect(
      decide(input({ chat: group, rules, userAsked: true }))[0].outcome,
    ).toBe('prepare');
  });

  test('5. after 20 automatic actions in a day, further ones are only prepared', () => {
    const remind = rule('remind', {
      then: { action: 'remind', params: {} },
      level: 'act',
      limits: { daily_cap: 99 },
    });
    const alert = rule('alert', {
      then: { action: 'alert', params: {} },
      level: 'act',
      limits: { daily_cap: 99 },
    });
    const decisions = decide(
      input({ rules: [remind, alert], autoActionsToday: 19 }),
    );
    expect(decisions.map(d => d.outcome)).toEqual(['do', 'prepare']);
    expect(decisions[1].reason).toMatch(/20/);
  });

  test('6. a message that tries to give instructions produces no action, with the reason', () => {
    const remind = rule('remind', {
      then: { action: 'remind', params: {} },
      level: 'act',
    });
    const decisions = decide(
      input({
        record: { ...record, instructionLike: true },
        rules: [rule('draft'), remind],
      }),
    );
    expect(decisions.map(d => d.outcome)).toEqual(['blocked', 'blocked']);
    expect(decisions[0].reason).toMatch(/instructions/i);
  });

  test("a rule's own daily cap blocks it once reached", () => {
    const [decision] = decide(input({ actionsTodayByRule: { draft: 5 } }));
    expect(decision.outcome).toBe('blocked');
    expect(decision.reason).toMatch(/daily limit/i);
  });
});

describe('built-in rules', () => {
  test('there are three, all switched off, and none sends anything by itself', () => {
    expect(BUILTIN_RULES).toHaveLength(3);
    expect(BUILTIN_RULES.every(r => !r.enabled)).toBe(true);
    for (const builtin of BUILTIN_RULES) {
      if (builtin.definition.then.action === 'draft') {
        expect(builtin.definition.level).toBe('prepare');
      }
    }
  });

  test('switched on: a deadline is reminded, a private question drafted, an urgent message alerted', () => {
    const on = BUILTIN_RULES.map(r => ({ ...r, enabled: true }));
    const actions = (r: Partial<MiraRecord>) =>
      decide(input({ rules: on, record: { ...record, ...r } }))
        .filter(d => d.outcome !== 'blocked')
        .map(d => d.action);
    expect(actions({ type: 'deadline' })).toEqual(['remind']);
    expect(actions({ type: 'payment' })).toEqual(['remind']);
    expect(actions({ type: 'question' })).toEqual(['draft']);
    expect(actions({ type: 'announcement', urgency: 'high' })).toEqual([
      'alert',
    ]);
    expect(actions({ type: 'chatter' })).toEqual([]);
  });
});
