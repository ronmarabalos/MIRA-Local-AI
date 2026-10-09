import type { ReportItem, ReportLine } from './report';

/** Which record field an answer was read from. */
export type AskField = 'date' | 'amount' | 'request' | 'summary';

export type AskAnswer =
  | {
      kind: 'found';
      field: AskField;
      /** The field's value, copied from the record. */
      value: string;
      /** The record and its source message. */
      line: ReportLine;
      /** Other matching records, best first. */
      more: ReportLine[];
    }
  | { kind: 'none' };

export const NOT_FOUND = "I couldn't find that in your messages.";

const DAY = 24 * 60 * 60 * 1000;

/** Words that pick the field to answer from, English and Tagalog. */
const INTENTS: [Exclude<AskField, 'summary'>, RegExp][] = [
  ['date', /\b(when|deadline|due|date|until|kailan|what time|anong oras)\b/],
  ['amount', /\b(how much|pay|payment|fee|fees|amount|cost|price|magkano|bayad|babayaran)\b/],
  ['request', /\b(what do i need|what should i|what must i|asked|request|need to|to do|todo|gagawin)\b/],
];

/** Words in a question that say nothing about which message is meant. */
const STOP = new Set(
  (
    'a an and any are as at be by can could did do does for from have how i in ' +
    'is it me my of on or should tell the there this to was what when where which who will with ' +
    'you your about need much due deadline date time pay payment fee fees amount cost price ' +
    'asked request todo until anything something message messages next upcoming all ' +
    'ang ng sa na mga ba kailan magkano anong oras bayad babayaran gagawin ko ako'
  ).split(' '),
);

/** Date words that narrow the search to a window of days from today. */
const WINDOWS: [RegExp, number, number][] = [
  [/\b(today|tonight|ngayon|mamaya)\b/, 0, 1],
  [/\b(tomorrow|bukas)\b/, 1, 2],
  [/\bnext week\b|\bsusunod na linggo\b/, 7, 14],
  [/\bthis week\b/, 0, 7],
];

/**
 * Answers a question from stored records by keyword and date search, with no
 * model call. The answer is always a record field plus the message it came
 * from, so the user can check it. Records that try to give MIRA orders,
 * promotions, chatter, and copies are never used.
 */
export function ask(question: string, items: ReportItem[], now: number): AskAnswer {
  const q = question.toLowerCase().replace(/[’']/g, "'");
  const intent = INTENTS.find(([, pattern]) => pattern.test(q))?.[0] ?? 'summary';
  const window = WINDOWS.find(([pattern]) => pattern.test(q));
  const words = (q.match(/[\p{L}\p{N}]+/gu) ?? []).filter(
    w => w.length > 2 && !STOP.has(w) && !(window && window[0].test(w)),
  );

  const today = new Date(now).setHours(0, 0, 0, 0);
  const lines = items.filter(
    (i): i is ReportLine =>
      i.record !== null &&
      i.message.status === 'processed' &&
      i.record.duplicateOf === null &&
      !i.record.instructionLike &&
      i.record.type !== 'promotion' &&
      i.record.type !== 'chatter',
  );

  const scored = lines
    .filter(l => {
      if (!window) return true;
      const at = l.record.dateAt ?? l.message.postedAt;
      return at >= today + window[1] * DAY && at < today + window[2] * DAY;
    })
    .map(line => ({ line, hits: words.filter(w => haystack(line).includes(w)).length }))
    // A question with its own words must match one of them; one without
    // (for example "when is the deadline?") needs the field it asks for.
    .filter(({ line, hits }) => (words.length > 0 ? hits > 0 : field(line, intent) !== null))
    .map(({ line, hits }) => ({ line, score: hits * 3 + boost(line, intent) }))
    .sort((a, b) => b.score - a.score || order(a.line, b.line, intent, today));

  if (scored.length === 0) return { kind: 'none' };
  const [best, ...rest] = scored.map(s => s.line);
  const value = field(best, intent);
  return {
    kind: 'found',
    field: value === null ? 'summary' : intent,
    value: value ?? best.record.summary,
    line: best,
    more: rest.slice(0, 4),
  };
}

function haystack({ record, message, chat }: ReportLine): string {
  return [
    record.summary,
    record.request,
    record.dateText,
    record.amount,
    record.type.replace('_', ' '),
    message.text,
    message.sender,
    chat.title,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function field({ record }: ReportLine, intent: AskField): string | null {
  switch (intent) {
    case 'date':
      return record.dateText;
    case 'amount':
      return record.amount;
    case 'request':
      return record.request;
    case 'summary':
      return record.summary;
  }
}

function boost(line: ReportLine, intent: AskField): number {
  const { record } = line;
  let score = field(line, intent) !== null ? 2 : 0;
  if (intent === 'date' && record.type === 'deadline') score += 1;
  if (intent === 'amount' && record.type === 'payment') score += 1;
  if (intent === 'request' && record.needsUser) score += 1;
  return score;
}

/** Ties: for dates, the next one coming first; otherwise the newest message. */
function order(a: ReportLine, b: ReportLine, intent: AskField, today: number): number {
  if (intent === 'date') {
    // Upcoming dates by time, then past dates, then undated.
    const rank = (l: ReportLine) =>
      l.record.dateAt === null
        ? Number.MAX_VALUE
        : l.record.dateAt >= today
        ? l.record.dateAt
        : Number.MAX_SAFE_INTEGER;
    const diff = rank(a) - rank(b);
    if (diff) return diff;
  }
  return b.message.postedAt - a.message.postedAt;
}
