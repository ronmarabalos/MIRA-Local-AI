/**
 * Shared types for both lanes. Frozen after Phase 0: announce a change first
 * and push it as its own small commit (see docs/PLAN.md).
 */

/** One message inside a notification that uses Android's messaging style. */
export interface NotificationMessage {
  sender: string;
  text: string;
  time: number;
}

/** A notification as the Kotlin listener hands it over (spec 4.1). */
export interface CapturedNotification {
  key: string;
  packageName: string;
  postedAt: number;
  title: string | null;
  text: string | null;
  bigText: string | null;
  conversationTitle: string | null;
  isGroup: boolean;
  messages: NotificationMessage[];
  category: string | null;
  isOngoing: boolean;
  canReply: boolean;
}

export type ChannelLevel = 1 | 2;

export interface Channel {
  packageName: string;
  label: string;
  enabled: boolean;
  /** 1 reads and reports, 2 also drafts replies. */
  level: ChannelLevel;
}

export type ChatKind = 'private' | 'group';

export interface Chat {
  id: string;
  packageName: string;
  title: string;
  kind: ChatKind;
}

export type MessageStatus = 'new' | 'filtered' | 'processed' | 'failed';

export interface Message {
  id: string;
  notificationKey: string;
  packageName: string;
  chatId: string;
  sender: string;
  text: string;
  postedAt: number;
  truncated: boolean;
  canReply: boolean;
  status: MessageStatus;
}

export type RecordType =
  | 'request'
  | 'question'
  | 'deadline'
  | 'payment'
  | 'schedule_change'
  | 'announcement'
  | 'chatter'
  | 'promotion'
  | 'other';

export type Urgency = 'low' | 'normal' | 'high';

/** Exactly what the model must return (spec 5.2). Keys match the JSON. */
export interface ExtractedRecord {
  type: RecordType;
  summary: string;
  needs_user: boolean;
  urgency: Urgency;
  request: string | null;
  date_text: string | null;
  amount: string | null;
  sensitive: boolean;
  instruction_like: boolean;
}

/** A record after the verifier has checked it, as stored. */
export interface MiraRecord {
  messageId: string;
  type: RecordType;
  summary: string;
  needsUser: boolean;
  urgency: Urgency;
  request: string | null;
  amount: string | null;
  dateText: string | null;
  dateAt: number | null;
  sensitive: boolean;
  instructionLike: boolean;
  duplicateOf: string | null;
}

export type RuleAction = 'remind' | 'calendar' | 'alert' | 'file' | 'draft';
export type RuleLevel = 'observe' | 'prepare' | 'act';

/** The definition of a rule (spec 5.3). Keys match the JSON. */
export interface RuleDefinition {
  when: 'message';
  if: {
    types?: RecordType[];
    apps?: string[];
    chat_kind?: ChatKind | 'any';
    senders?: string[];
    contains?: string[];
    urgency_min?: Urgency;
  };
  then: { action: RuleAction; params: Record<string, string> };
  level: RuleLevel;
  limits: { daily_cap: number };
}

export interface Rule {
  id: string;
  sentence: string;
  definition: RuleDefinition;
  level: RuleLevel;
  enabled: boolean;
  createdAt: number;
}

export type DraftStatus = 'waiting' | 'approved' | 'sent' | 'discarded';

export interface Draft {
  id: string;
  messageId: string;
  text: string;
  firstText: string;
  status: DraftStatus;
}

export type ActionKind = RuleAction | 'send';

export type ActionStatus =
  | 'queued'
  | 'done'
  | 'failed'
  | 'blocked'
  | 'needs_you'
  | 'undone';

export interface Action {
  id: string;
  ruleId: string | null;
  messageId: string;
  kind: ActionKind;
  payload: Record<string, string>;
  status: ActionStatus;
  reason: string | null;
  createdAt: number;
  doneAt: number | null;
}

/** What the rule engine decides for one rule and one message (spec 4.8). */
export interface Decision {
  outcome: 'do' | 'prepare' | 'blocked';
  action: RuleAction;
  ruleId: string;
  reason: string | null;
}
