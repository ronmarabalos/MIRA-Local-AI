import * as chrono from 'chrono-node';

/**
 * Tagalog date words, put into English before `chrono-node` reads the phrase.
 * Longer phrases come first so "susunod na linggo" wins over "linggo".
 */
const TAGALOG: [RegExp, string][] = [
  [/\bsa susunod na linggo\b/gi, 'next week'],
  [/\bsusunod na linggo\b/gi, 'next week'],
  [/\bbukas\b/gi, 'tomorrow'],
  [/\bmamaya\b/gi, 'today'],
  [/\bngayon\b/gi, 'today'],
  [/\blunes\b/gi, 'Monday'],
  [/\bmartes\b/gi, 'Tuesday'],
  [/\bmiyerkules\b/gi, 'Wednesday'],
  [/\bhuwebes\b/gi, 'Thursday'],
  [/\bbiyernes\b/gi, 'Friday'],
  [/\bsabado\b/gi, 'Saturday'],
  [/\blinggo\b/gi, 'Sunday'],
  [/^\s*sa\s+/i, ''],
];

/**
 * Turns a date phrase copied from a message into a time, counted from when the
 * message was posted (spec 4.6). The model never does this arithmetic. Returns
 * null when the phrase names no date.
 */
export function resolveDate(phrase: string, postedAt: number): number | null {
  const english = TAGALOG.reduce((text, [pattern, word]) => text.replace(pattern, word), phrase);
  const date = chrono.parseDate(english, new Date(postedAt), { forwardDate: true });
  return date ? date.getTime() : null;
}
