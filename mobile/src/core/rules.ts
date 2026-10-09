import type {
  ChannelLevel,
  Chat,
  Decision,
  Message,
  MiraRecord,
  Rule,
  RuleAction,
  Urgency,
} from './types';

export interface RuleInput {
  record: MiraRecord;
  message: Message;
  chat: Chat;
  rules: Rule[];
  /** The channel's permission level: 1 reads and reports, 2 also drafts replies. */
  channelLevel: ChannelLevel;
  /** Automatic actions already done today, across all rules. */
  autoActionsToday: number;
  /** Actions each rule has already caused today, by rule id. */
  actionsTodayByRule: Record<string, number>;
  /** True when the user asked for this by hand, which lifts the group-chat limit. */
  userAsked?: boolean;
}

/** At most this many automatic actions a day; further ones are only prepared. */
export const DAILY_AUTO_LIMIT = 20;

const URGENCY_ORDER: Urgency[] = ['low', 'normal', 'high'];

const includesIgnoringCase = (list: string[], value: string) =>
  list.some(item => item.toLowerCase() === value.toLowerCase());

function matches(rule: Rule, { record, message, chat }: RuleInput): boolean {
  const when = rule.definition.if;
  if (when.types?.length && !when.types.includes(record.type)) return false;
  if (when.apps?.length && !when.apps.includes(message.packageName))
    return false;
  if (
    when.chat_kind &&
    when.chat_kind !== 'any' &&
    when.chat_kind !== chat.kind
  )
    return false;
  if (
    when.senders?.length &&
    !includesIgnoringCase(when.senders, message.sender)
  )
    return false;
  if (when.contains?.length) {
    const text = message.text.toLowerCase();
    if (!when.contains.some(word => text.includes(word.toLowerCase())))
      return false;
  }
  if (
    when.urgency_min &&
    URGENCY_ORDER.indexOf(record.urgency) <
      URGENCY_ORDER.indexOf(when.urgency_min)
  ) {
    return false;
  }
  return true;
}

/**
 * What each enabled, matching rule may do about one message (spec 4.8). The
 * rule says what it wants; the hard limits below are applied afterwards to
 * every decision and cannot be configured.
 */
export function decide(input: RuleInput): Decision[] {
  const { record, chat, channelLevel, actionsTodayByRule, userAsked } = input;
  let autoDone = input.autoActionsToday;
  const decisions: Decision[] = [];

  for (const rule of input.rules) {
    const { level, then, limits } = rule.definition;
    if (!rule.enabled || level === 'observe' || !matches(rule, input)) continue;

    const action: RuleAction = then.action;
    const blocked = (reason: string): Decision => ({
      outcome: 'blocked',
      action,
      ruleId: rule.id,
      reason,
    });

    // 6. Text that tries to give instructions never causes an action.
    if (record.instructionLike) {
      decisions.push(
        blocked('The message tries to give instructions, so nothing was done.'),
      );
      continue;
    }
    if ((actionsTodayByRule[rule.id] ?? 0) >= limits.daily_cap) {
      decisions.push(blocked("This rule's daily limit has been reached."));
      continue;
    }

    if (action === 'draft') {
      // 1. Nothing beyond the channel's permission level.
      if (channelLevel < 2) {
        decisions.push(
          blocked(
            'This app is set to read and report only, so no reply was drafted.',
          ),
        );
        continue;
      }
      // 3. Sensitive messages never get an automatic draft.
      if (record.sensitive) {
        decisions.push(
          blocked('The message looks sensitive, so no reply was drafted.'),
        );
        continue;
      }
      // 4. No drafts for group conversations unless the user asks.
      if (chat.kind === 'group' && !userAsked) {
        decisions.push(
          blocked('Replies to group chats are only drafted when you ask.'),
        );
        continue;
      }
      // 2. Sending is never automatic: a draft is at most prepared.
      decisions.push({
        outcome: 'prepare',
        action,
        ruleId: rule.id,
        reason: null,
      });
      continue;
    }

    if (level === 'act') {
      // 5. The daily ceiling on automatic actions.
      if (autoDone >= DAILY_AUTO_LIMIT) {
        decisions.push({
          outcome: 'prepare',
          action,
          ruleId: rule.id,
          reason: `${DAILY_AUTO_LIMIT} automatic actions have already run today.`,
        });
        continue;
      }
      autoDone += 1;
      decisions.push({ outcome: 'do', action, ruleId: rule.id, reason: null });
      continue;
    }

    decisions.push({
      outcome: 'prepare',
      action,
      ruleId: rule.id,
      reason: null,
    });
  }

  return decisions;
}
