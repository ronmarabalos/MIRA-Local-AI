import type { Message, MiraRecord } from './types';

/** Copies are looked for among messages from the last 48 hours (spec 4.7). */
export const DUPLICATE_WINDOW_MS = 48 * 60 * 60 * 1000;

const OVERLAP = 0.8;
/** Below this many words, only an exact match counts: short messages look alike by chance. */
const MIN_WORDS_FOR_OVERLAP = 8;

function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * True when two messages say the same thing: the same words once case,
 * punctuation, and spacing are ignored, or, for longer messages, at least
 * 80% of their words in common.
 */
export function isSameText(a: string, b: string): boolean {
  const wa = words(a);
  const wb = words(b);
  if (wa.length === 0 || wb.length === 0) return false;
  if (wa.join(' ') === wb.join(' ')) return true;
  if (Math.min(wa.length, wb.length) < MIN_WORDS_FOR_OVERLAP) return false;

  const counts = new Map<string, number>();
  for (const word of wa) counts.set(word, (counts.get(word) ?? 0) + 1);
  let shared = 0;
  for (const word of wb) {
    const left = counts.get(word) ?? 0;
    if (left > 0) {
      shared += 1;
      counts.set(word, left - 1);
    }
  }
  return shared / Math.max(wa.length, wb.length) >= OVERLAP;
}

export interface DuplicateCandidate {
  message: Message;
  record: MiraRecord | null;
}

/**
 * The id of the earlier message this one repeats, or null. Only messages the
 * model has already read count as originals, and a copy of a copy points at
 * the first message. Spec 4.7 speaks of the same notice in two chats; the
 * same message sent twice in one chat is treated the same way.
 */
export function findDuplicate(
  message: Message,
  candidates: DuplicateCandidate[],
): string | null {
  let original: Message | null = null;
  for (const candidate of candidates) {
    const other = candidate.message;
    if (
      other.id === message.id ||
      candidate.record === null ||
      candidate.record.duplicateOf !== null ||
      other.postedAt > message.postedAt ||
      message.postedAt - other.postedAt > DUPLICATE_WINDOW_MS ||
      !isSameText(message.text, other.text)
    ) {
      continue;
    }
    if (!original || other.postedAt < original.postedAt) {
      original = other;
    }
  }
  return original?.id ?? null;
}
