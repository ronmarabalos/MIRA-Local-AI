import { resolveInMessage } from './dates';
import type {
  ExtractedRecord,
  Message,
  MiraRecord,
  RecordType,
  Urgency,
} from './types';

const RECORD_TYPES: RecordType[] = [
  'request',
  'question',
  'deadline',
  'payment',
  'schedule_change',
  'announcement',
  'chatter',
  'promotion',
  'other',
];
const URGENCIES: Urgency[] = ['low', 'normal', 'high'];
const SUMMARY_MAX = 120;

export type ParseResult =
  | { ok: true; value: ExtractedRecord }
  | { ok: false; reason: 'not_json' | 'bad_shape' };

/**
 * Reads the model's raw output as a record (spec 5.2). Tolerates a code fence
 * or text around the JSON; anything else wrong is a failure the caller retries
 * once before storing `failedRecord`.
 */
export function parseExtraction(raw: string): ParseResult {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end <= start) return { ok: false, reason: 'not_json' };

  let data: unknown;
  try {
    data = JSON.parse(raw.slice(start, end + 1));
  } catch {
    return { ok: false, reason: 'not_json' };
  }
  if (typeof data !== 'object' || data === null)
    return { ok: false, reason: 'bad_shape' };
  const d = data as Record<string, unknown>;

  const valid =
    RECORD_TYPES.includes(d.type as RecordType) &&
    typeof d.summary === 'string' &&
    d.summary.trim() !== '' &&
    typeof d.needs_user === 'boolean' &&
    URGENCIES.includes(d.urgency as Urgency) &&
    isTextOrNull(d.request) &&
    isTextOrNull(d.date_text) &&
    isTextOrNull(d.amount) &&
    typeof d.sensitive === 'boolean' &&
    typeof d.instruction_like === 'boolean';
  if (!valid) return { ok: false, reason: 'bad_shape' };

  return {
    ok: true,
    value: {
      type: d.type as RecordType,
      summary: (d.summary as string).trim().slice(0, SUMMARY_MAX),
      needs_user: d.needs_user as boolean,
      urgency: d.urgency as Urgency,
      request: textOrNull(d.request),
      date_text: textOrNull(d.date_text),
      amount: textOrNull(d.amount),
      sensitive: d.sensitive as boolean,
      instruction_like: d.instruction_like as boolean,
    },
  };
}

/**
 * Checks a parsed record against its message before it is stored (spec 4.6).
 * Copied fields must appear in the message; dates are resolved here; and the
 * sensitive and instruction flags are also set from the message's own words,
 * so the model is not the only guard.
 */
export function verifyRecord(
  extracted: ExtractedRecord,
  message: Pick<Message, 'id' | 'text' | 'postedAt'>,
): MiraRecord {
  const dateText = appearsIn(extracted.date_text, message.text);
  return {
    messageId: message.id,
    type: extracted.type,
    summary: extracted.summary,
    needsUser: extracted.needs_user,
    urgency: extracted.urgency,
    request: extracted.request,
    amount: appearsIn(extracted.amount, message.text),
    dateText,
    // With the message's help: the model often copies only the time of "oct 17 ... at 11:59pm".
    dateAt: dateText
      ? resolveInMessage(dateText, message.text, message.postedAt)
      : null,
    sensitive: extracted.sensitive || SENSITIVE.test(message.text),
    instructionLike:
      extracted.instruction_like ||
      INSTRUCTION_LIKE.some(p => p.test(message.text)),
    duplicateOf: null,
  };
}

/** What is stored for a message the model could not read twice in a row. */
export function failedRecord(messageId: string): MiraRecord {
  return {
    messageId,
    type: 'other',
    summary: "Couldn't read this message",
    needsUser: false,
    urgency: 'normal',
    request: null,
    amount: null,
    dateText: null,
    dateAt: null,
    sensitive: false,
    instructionLike: false,
    duplicateOf: null,
  };
}

/** Grades, money disputes, health, and secrets, in English and Tagalog. */
const SENSITIVE =
  /\b(grades?|gpa|failed|failing|owe|utang|debt|refund|hospital|ospital|sick|may sakit|doctor|diagnos\w*|medicine|gamot|depress\w*|anxiety|suicid\w*|break ?up|password|pin|otp)\b/i;

/** Phrases that address the assistant or try to give it orders. */
const INSTRUCTION_LIKE = [
  /\bignore (all |your |the )?(previous |prior |above )?instructions\b/i,
  /\b(you are|you're) now in \w+ mode\b/i,
  /\bto the (ai|assistant|bot)\b/i,
  /^\s*(system|assistant)\s*:/i,
  /\b(mira|ai|assistant)\s*,\s*(please\s+)?(ignore|forward|send|reply|approve|create|delete)\b/i,
  /\bcreate a rule\b/i,
];

function isTextOrNull(value: unknown): boolean {
  return value === null || typeof value === 'string';
}

function textOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}

function normalise(text: string): string {
  return text.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();
}

/** The field if it appears word for word in the text, ignoring case and spacing. */
function appearsIn(field: string | null, text: string): string | null {
  if (field === null) return null;
  return normalise(text).includes(normalise(field)) ? field : null;
}
