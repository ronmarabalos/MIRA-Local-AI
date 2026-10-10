import { addKeepWord, keepsMessage } from './keep';

const msg = (text: string, sender = 'Carla', chat = 'ACM Org') => ({ text, sender, chatTitle: chat });

describe('keepsMessage', () => {
  test('with no words, every message from a switched-on app is kept', () => {
    expect(keepsMessage([], msg('hey whats up'))).toBe(true);
  });

  test('a message is kept when it contains any word, ignoring case', () => {
    expect(keepsMessage(['announcement'], msg('ANNOUNCEMENT: no class tomorrow'))).toBe(true);
    expect(keepsMessage(['exam', 'payment'], msg('The payment is due Friday'))).toBe(true);
  });

  test('a message without any word is not kept', () => {
    expect(keepsMessage(['announcement'], msg('lol nice one'))).toBe(false);
  });

  test('the word may be part of a longer word, so "announce" finds "announcement"', () => {
    expect(keepsMessage(['announce'], msg('Announcement from the dean'))).toBe(true);
  });

  test('the chat name and sender count too', () => {
    expect(keepsMessage(['org'], msg('meeting at 3', 'Jun', 'ACM Org Officers'))).toBe(true);
    expect(keepsMessage(['dean'], msg('see attached', 'Office of the Dean'))).toBe(true);
  });

  test('a phrase of several words matches as written', () => {
    expect(keepsMessage(['no class'], msg('Reminder: No class on Monday'))).toBe(true);
    expect(keepsMessage(['no class'], msg('no, the class is on'))).toBe(false);
  });
});

describe('addKeepWord', () => {
  test('tidies the word and skips blanks and repeats', () => {
    expect(addKeepWord([], '  Announcement ')).toEqual(['announcement']);
    expect(addKeepWord(['announcement'], 'ANNOUNCEMENT')).toEqual(['announcement']);
    expect(addKeepWord(['exam'], '   ')).toEqual(['exam']);
    expect(addKeepWord([], 'no   class')).toEqual(['no class']);
  });

  test('keeps a word short enough to read', () => {
    expect(addKeepWord([], 'x'.repeat(80))[0]).toHaveLength(40);
  });
});
