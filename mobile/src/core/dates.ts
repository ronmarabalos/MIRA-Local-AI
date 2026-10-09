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
  const date = chrono.parseDate(toEnglish(phrase), new Date(postedAt), {
    forwardDate: true,
  });
  return date ? date.getTime() : null;
}

const toEnglish = (text: string) =>
  TAGALOG.reduce((out, [pattern, word]) => out.replace(pattern, word), text);

type Parsed = ReturnType<typeof chrono.parse>[number];

const parse = (text: string, postedAt: number): Parsed[] =>
  chrono.parse(toEnglish(text), new Date(postedAt), { forwardDate: true });

/** True when the text itself named a day: a date, a weekday, or a word like "tomorrow". */
const namesDay = (result: Parsed) =>
  result.start.isCertain('day') || result.start.isCertain('weekday');

const namesTime = (result: Parsed) => result.start.isCertain('hour');

/**
 * Resolves a date phrase with the rest of its message to help. The model
 * often copies only the time ("11:59pm") from "oct 17, ... at 11:59pm"; read
 * alone, that would land on the day the message was posted. When the phrase
 * names no day, the day comes from the message, and the phrase keeps its time.
 *
 * `hasTime` says whether a time of day was actually written. Without one the
 * library still fills in an hour (noon, or the hour the message arrived), which
 * must not be shown as if the message had said it.
 */
export function resolveWhen(
  phrase: string,
  messageText: string,
  postedAt: number,
): { at: number; hasTime: boolean } | null {
  const inPhrase = parse(phrase, postedAt);
  const phraseDay = inPhrase.find(namesDay);
  if (phraseDay) {
    return {
      at: phraseDay.start.date().getTime(),
      hasTime: namesTime(phraseDay),
    };
  }

  const inMessage = parse(messageText, postedAt);
  const messageDay = inMessage.find(namesDay);
  if (!messageDay) {
    const alone = inPhrase[0];
    return alone
      ? { at: alone.start.date().getTime(), hasTime: namesTime(alone) }
      : null;
  }

  const date = messageDay.start.date();
  let hasTime = namesTime(messageDay);
  if (!hasTime) {
    const time = inPhrase.find(namesTime) ?? inMessage.find(namesTime);
    if (time) {
      date.setHours(
        time.start.get('hour') ?? 12,
        time.start.get('minute') ?? 0,
        0,
        0,
      );
      hasTime = true;
    }
  }
  return { at: date.getTime(), hasTime };
}

/** The time `resolveWhen` gives, or null when nothing in the phrase or message names one. */
export function resolveInMessage(
  phrase: string,
  messageText: string,
  postedAt: number,
): number | null {
  return resolveWhen(phrase, messageText, postedAt)?.at ?? null;
}
