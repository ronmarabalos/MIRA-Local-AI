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

const startOfDay = (at: number) => {
  const d = new Date(at);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/** `days` whole days after a local midnight, safe across daylight-saving changes. */
const addDays = (midnight: number, days: number) => {
  const d = new Date(midnight);
  d.setDate(d.getDate() + days);
  return d.getTime();
};

/** Monday 00:00 of the week holding `at`. */
const mondayOf = (at: number) => {
  const today = startOfDay(at);
  const back = (new Date(today).getDay() + 6) % 7;
  return addDays(today, -back);
};

const monthStart = (at: number, plus: number) => {
  const d = new Date(at);
  return new Date(d.getFullYear(), d.getMonth() + plus, 1).getTime();
};

/** Time words a question can use, English and Tagalog; longer phrases first. */
const WINDOWS: [RegExp, (now: number) => [number, number]][] = [
  [/\b(?:sa )?susunod na linggo\b|\bnext week\b/i, now => [addDays(mondayOf(now), 7), addDays(mondayOf(now), 14)]],
  [/\bngayong linggo\b|\bthis week\b/i, now => [mondayOf(now), addDays(startOfDay(now), 7)]],
  [/\b(?:this )?weekend\b/i, now => [addDays(mondayOf(now), 5), addDays(mondayOf(now), 7)]],
  [/\b(?:susunod na buwan|next month)\b/i, now => [monthStart(now, 1), monthStart(now, 2)]],
  [/\b(?:ngayong buwan|this month)\b/i, now => [monthStart(now, 0), monthStart(now, 1)]],
  [/\b(?:tomorrow|bukas)\b/i, now => [addDays(startOfDay(now), 1), addDays(startOfDay(now), 2)]],
  [/\b(?:yesterday|kahapon)\b/i, now => [addDays(startOfDay(now), -1), startOfDay(now)]],
  [/\b(?:today|tonight|ngayon|mamaya)\b/i, now => [startOfDay(now), addDays(startOfDay(now), 1)]],
];

/**
 * The span of time a question asks about ("what's due this week?", "may klase
 * ba bukas?"), as local midnights [from, to), with the words that named it so
 * they are not searched for as well. Null when the question names no time.
 */
export function questionWindow(
  question: string,
  now: number,
): { from: number; to: number; phrase: string } | null {
  for (const [pattern, span] of WINDOWS) {
    const match = question.match(pattern);
    if (match) {
      const [from, to] = span(now);
      return { from, to, phrase: match[0] };
    }
  }
  // A named day: "friday", "oct 20", "Biyernes".
  const english = toEnglish(question);
  const named = parse(english, now).find(namesDay);
  if (!named) return null;
  const from = startOfDay(named.start.date().getTime());
  return { from, to: addDays(from, 1), phrase: named.text };
}
