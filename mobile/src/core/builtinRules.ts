import type { Rule, RuleDefinition } from './types';

const builtin = (
  id: string,
  sentence: string,
  definition: RuleDefinition,
): Rule => ({
  id,
  sentence,
  definition,
  level: definition.level,
  enabled: false,
  createdAt: 0,
});

/**
 * The rules MIRA ships with, in place of rules typed in words for this build.
 * All are off until the user switches them on from the Rules screen.
 */
export const BUILTIN_RULES: Rule[] = [
  builtin('builtin-remind', 'Remind me about deadlines and payments.', {
    when: 'message',
    if: { types: ['deadline', 'payment'] },
    then: { action: 'remind', params: {} },
    level: 'act',
    limits: { daily_cap: 10 },
  }),
  builtin(
    'builtin-draft',
    'Draft replies to questions in private chats, for me to approve.',
    {
      when: 'message',
      if: { types: ['question'], chat_kind: 'private' },
      then: { action: 'draft', params: {} },
      level: 'prepare',
      limits: { daily_cap: 10 },
    },
  ),
  builtin('builtin-alert', 'Alert me right away about urgent messages.', {
    when: 'message',
    if: {
      urgency_min: 'high',
      types: [
        'request',
        'question',
        'schedule_change',
        'announcement',
        'other',
      ],
    },
    then: { action: 'alert', params: {} },
    level: 'act',
    limits: { daily_cap: 10 },
  }),
];
