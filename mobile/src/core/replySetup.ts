/**
 * The answers from "Should I help answer your messages?", as the draft rule
 * they switch on. Drafts are only ever prepared: sending still needs the
 * user's tap and confirmation in Approvals (safety requirement 2).
 */
import type { ReportItem } from './report';
import type { RecordType, Rule } from './types';

export interface ReplySetup {
  /** The kinds of message MIRA drafts replies to. */
  kinds: RecordType[];
  /** Group chats as well as private ones. */
  groups: boolean;
}

/** The kinds offered, in the order shown. */
export const REPLY_KINDS: { kind: RecordType; label: string }[] = [
  { kind: 'question', label: 'Questions' },
  { kind: 'request', label: 'Requests and favours' },
  { kind: 'schedule_change', label: 'Plans and schedule changes' },
];

/** The built-in draft rule, rewritten from the answers and switched on. */
export function draftRuleFor(base: Rule, setup: ReplySetup): Rule {
  return {
    ...base,
    enabled: true,
    definition: {
      ...base.definition,
      if: {
        ...base.definition.if,
        types: [...setup.kinds],
        chat_kind: setup.groups ? 'any' : 'private',
      },
      then: { action: 'draft', params: {} },
      level: 'prepare',
    },
    level: 'prepare',
  };
}

/** The answers a draft rule holds, to start the chat from what was chosen before. */
export function setupFromRule(rule: Rule): ReplySetup {
  return {
    kinds: rule.definition.if.types ?? ['question'],
    groups: rule.definition.if.chat_kind === 'any',
  };
}

const startOfDay = (at: number) => {
  const d = new Date(at);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/**
 * Today's messages MIRA may draft a reply to right after setup: the chosen
 * kinds, in apps allowed to draft, still answerable, and never one that tries
 * to give instructions.
 */
export function messagesToDraft(
  items: ReportItem[],
  setup: ReplySetup,
  draftApps: string[],
  now: number,
): ReportItem[] {
  const from = startOfDay(now);
  return items.filter(
    ({ message, chat, record }) =>
      !!record &&
      message.status === 'processed' &&
      message.postedAt >= from &&
      message.canReply &&
      !record.instructionLike &&
      record.duplicateOf === null &&
      setup.kinds.includes(record.type) &&
      (setup.groups || chat.kind === 'private') &&
      draftApps.includes(message.packageName),
  );
}
