import type { ReportItem } from './report';
import type { RecordType } from './types';

export type InboxFilter = 'all' | 'needs' | 'dated' | 'ignored';

export interface Inbox {
  /** The chosen filter's messages, newest first. A merged first message carries `seen`. */
  rows: ReportItem[];
  /** How many messages each filter holds, for the chosen app. */
  counts: Record<InboxFilter, number>;
  /** Every app with at least one message, most first. Not narrowed by the chosen app. */
  apps: { packageName: string; count: number }[];
}

export const TYPE_LABELS: Record<RecordType, string> = {
  request: 'Request',
  question: 'Question',
  deadline: 'Deadline',
  payment: 'Payment',
  schedule_change: 'Schedule change',
  announcement: 'Announcement',
  chatter: 'Chatter',
  promotion: 'Promotion',
  other: 'Other',
};

/** True once the model, or the quick filter, has described the message. */
const wasRead = (item: ReportItem) =>
  item.record !== null &&
  item.message.status !== 'new' &&
  item.message.status !== 'failed';

const isIgnored = (item: ReportItem) =>
  item.record?.type === 'chatter' || item.record?.type === 'promotion';

const MEMBER: Record<InboxFilter, (item: ReportItem) => boolean> = {
  all: () => true,
  needs: item =>
    wasRead(item) &&
    !!item.record?.needsUser &&
    !isIgnored(item) &&
    !item.record?.instructionLike,
  dated: item =>
    wasRead(item) &&
    !!item.record &&
    item.record.dateText !== null &&
    !item.record.instructionLike,
  ignored: item => wasRead(item) && isIgnored(item),
};

/**
 * What the Inbox shows (Inbox and Planner spec, section 2): every stored
 * message except copies, newest first, narrowed by a filter and an app.
 */
export function buildInbox(
  items: ReportItem[],
  options: { filter: InboxFilter; packageName: string | null },
): Inbox {
  const copies = new Map<string, ReportItem[]>();
  for (const item of items) {
    const originalId = item.record?.duplicateOf;
    if (originalId)
      copies.set(originalId, [...(copies.get(originalId) ?? []), item]);
  }
  const originals = items
    .filter(item => !item.record?.duplicateOf)
    .map(item => {
      const again = copies.get(item.message.id);
      if (!again) return item;
      const chats = new Set([item.chat.id, ...again.map(copy => copy.chat.id)]);
      return { ...item, seen: { times: again.length + 1, chats: chats.size } };
    });

  const perApp = new Map<string, number>();
  for (const item of originals) {
    perApp.set(
      item.message.packageName,
      (perApp.get(item.message.packageName) ?? 0) + 1,
    );
  }
  const apps = [...perApp.entries()]
    .map(([packageName, count]) => ({ packageName, count }))
    .sort(
      (a, b) => b.count - a.count || a.packageName.localeCompare(b.packageName),
    );

  const inApp = options.packageName
    ? originals.filter(item => item.message.packageName === options.packageName)
    : originals;
  const count = (filter: InboxFilter) => inApp.filter(MEMBER[filter]).length;

  return {
    rows: inApp
      .filter(MEMBER[options.filter])
      .sort((a, b) => b.message.postedAt - a.message.postedAt),
    counts: {
      all: count('all'),
      needs: count('needs'),
      dated: count('dated'),
      ignored: count('ignored'),
    },
    apps,
  };
}

/** The line of labels above a row's sender: what kind of message it is, and when it arrived. */
export function labelLine(item: ReportItem, time: string): string {
  const { message, record } = item;
  let parts: string[];
  if (record === null || message.status === 'new') parts = ['Reading…'];
  else if (message.status === 'failed') parts = ['Couldn’t read'];
  else if (record.instructionLike) parts = ['Blocked'];
  else if (isIgnored(item)) parts = ['Ignored', TYPE_LABELS[record.type]];
  else {
    parts = [TYPE_LABELS[record.type]];
    if (record.needsUser) parts.push('Needs you');
    if (record.dateText) parts.push(record.dateText);
  }
  return [...parts, time].join(' · ');
}
