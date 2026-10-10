/**
 * Words the user chooses so MIRA keeps only matching messages ("keep anything
 * that says announcement"). They narrow what is stored from apps already
 * switched on; they never let in a message from an app that is off.
 */

/** A word is cut to this many characters, so the list stays readable. */
export const MAX_WORD_CHARS = 40;

const tidy = (word: string) =>
  word.toLowerCase().replace(/\s+/g, ' ').trim().slice(0, MAX_WORD_CHARS);

/** Adds a word, tidied, unless it is blank or already there. */
export function addKeepWord(words: string[], word: string): string[] {
  const next = tidy(word);
  return next === '' || words.includes(next) ? words : [...words, next];
}

/**
 * Whether a message should be kept. With no words, everything is kept.
 * Otherwise the message text, sender, or chat name must contain one of
 * them, ignoring case; "announce" also finds "announcement".
 */
export function keepsMessage(
  words: string[],
  message: { text: string; sender: string; chatTitle: string },
): boolean {
  if (words.length === 0) return true;
  const haystack = `${message.text} ${message.sender} ${message.chatTitle}`
    .toLowerCase()
    .replace(/\s+/g, ' ');
  return words.some(word => haystack.includes(word));
}
