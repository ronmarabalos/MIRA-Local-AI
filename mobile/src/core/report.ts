import type { Action, Chat, Message, MiraRecord, Urgency } from './types';

/** A stored message with its chat and, once processed, its record. */
export interface ReportItem {
  message: Message;
  chat: Chat;
  record: MiraRecord | null;
}

/** A report line always has its record, and through it its source message. */
export interface ReportLine extends ReportItem {
  record: MiraRecord;
}

export interface HandledLine {
  action: Action;
  /** The message the action was for, when it is in the items given. */
  item: ReportItem | null;
}

export type ReportFilter =
  | { kind: 'all' }
  | { kind: 'app'; packageName: string }
  | { kind: 'chat'; chatId: string };

/** The Today report (spec 4.10). */
export interface Report {
  needsYou: ReportLine[];
  datesFound: ReportLine[];
  announcements: ReportLine[];
  handled: HandledLine[];
  /** Promotions and chatter: counted, not listed. */
  ignored: number;
  couldNotRead: ReportItem[];
  /** Messages still waiting for the model, shown as placeholder rows. */
  waiting: number;
}

const URGENCY_RANK: Record<Urgency, number> = { high: 0, normal: 1, low: 2 };

/**
 * Builds the report from stored items and actions, with no model call. Pure:
 * the caller loads the day's items and actions and passes them in.
 */
export function buildReport(
  items: ReportItem[],
  actions: Action[],
  filter: ReportFilter = { kind: 'all' },
): Report {
  const shown = items.filter(i => matches(i, filter));
  const byId = new Map(items.map(i => [i.message.id, i]));

  // Lines the model read, minus copies linked to an earlier message.
  const lines = shown.filter(
    (i): i is ReportLine =>
      i.record !== null && i.message.status !== 'failed' && i.record.duplicateOf === null,
  );
  const ignoredTypes = (l: ReportLine) => l.record.type === 'promotion' || l.record.type === 'chatter';
  const readable = lines.filter(l => !ignoredTypes(l));
  // A message that tries to give MIRA orders is never presented as a to-do.
  const trusted = readable.filter(l => !l.record.instructionLike);

  return {
    needsYou: trusted
      .filter(l => l.record.needsUser)
      .sort(
        (a, b) =>
          URGENCY_RANK[a.record.urgency] - URGENCY_RANK[b.record.urgency] || newestFirst(a, b),
      ),
    datesFound: trusted
      .filter(l => l.record.dateAt !== null)
      .sort((a, b) => a.record.dateAt! - b.record.dateAt!),
    announcements: readable
      .filter(l => l.record.type === 'announcement' || l.record.type === 'schedule_change')
      .sort(newestFirst),
    handled: actions
      .filter(a => a.status === 'done' || a.status === 'queued')
      .map(action => ({ action, item: byId.get(action.messageId) ?? null }))
      .filter(h => filter.kind === 'all' || (h.item !== null && matches(h.item, filter))),
    ignored: lines.filter(ignoredTypes).length,
    couldNotRead: shown.filter(i => i.message.status === 'failed').sort(newestFirst),
    waiting: shown.filter(i => i.message.status === 'new').length,
  };
}

function matches(item: ReportItem, filter: ReportFilter): boolean {
  switch (filter.kind) {
    case 'all':
      return true;
    case 'app':
      return item.message.packageName === filter.packageName;
    case 'chat':
      return item.message.chatId === filter.chatId;
  }
}

function newestFirst(a: ReportItem, b: ReportItem): number {
  return b.message.postedAt - a.message.postedAt;
}
