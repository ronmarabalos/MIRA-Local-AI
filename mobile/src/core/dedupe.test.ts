import { findDuplicate, isSameText } from './dedupe';
import type { Message, MiraRecord } from './types';

const HOUR = 3_600_000;

const message = (
  id: string,
  text: string,
  postedAt: number,
  chatId = 'c1',
): Message => ({
  id,
  notificationKey: id,
  packageName: 'com.facebook.orca',
  chatId,
  sender: 'Maya',
  text,
  postedAt,
  truncated: false,
  canReply: true,
  status: 'processed',
});

const record = (
  messageId: string,
  duplicateOf: string | null = null,
): MiraRecord => ({
  messageId,
  type: 'question',
  summary: 's',
  needsUser: true,
  urgency: 'normal',
  request: null,
  amount: null,
  dateText: null,
  dateAt: null,
  sensitive: false,
  instructionLike: false,
  duplicateOf,
});

const TEXT = 'Can we move our group meeting to tomorrow at 3 PM?';
const stored = (
  id: string,
  text: string,
  at: number,
  chatId = 'c1',
  dup: string | null = null,
) => ({
  message: message(id, text, at, chatId),
  record: record(id, dup),
});

describe('isSameText', () => {
  test('ignores letter case, punctuation, and spacing', () => {
    expect(
      isSameText(TEXT, '  can we move our group meeting to tomorrow at 3 pm  '),
    ).toBe(true);
  });

  test('accepts a copy with a word or two changed', () => {
    expect(
      isSameText(
        'No classes on Monday, the campus is closed for the holiday, please tell your blockmates.',
        'No classes on Monday, the campus is closed for the holiday, please tell your classmates.',
      ),
    ).toBe(true);
  });

  test('keeps different messages apart, even short similar ones', () => {
    expect(
      isSameText(
        TEXT,
        'Can we move our group meeting to Friday at 5 PM instead?',
      ),
    ).toBe(false);
    expect(isSameText('See you at 3', 'See you at 5')).toBe(false);
  });
});

describe('findDuplicate', () => {
  test('the same message sent again in the same chat is a copy of the first', () => {
    const first = stored('a', TEXT, 0);
    expect(findDuplicate(message('b', TEXT, HOUR), [first])).toBe('a');
  });

  test('the same notice in another chat is a copy of the first', () => {
    const first = stored('a', TEXT, 0, 'group-1');
    expect(findDuplicate(message('b', TEXT, HOUR, 'group-2'), [first])).toBe(
      'a',
    );
  });

  test('a third copy points at the first message, not at the second copy', () => {
    const first = stored('a', TEXT, 0);
    const second = stored('b', TEXT, HOUR, 'c1', 'a');
    expect(findDuplicate(message('c', TEXT, 2 * HOUR), [second, first])).toBe(
      'a',
    );
  });

  test('a message is not a copy of itself, of a later one, or of one more than 48 hours old', () => {
    const me = message('a', TEXT, 50 * HOUR);
    expect(findDuplicate(me, [stored('a', TEXT, 50 * HOUR)])).toBeNull();
    expect(findDuplicate(me, [stored('later', TEXT, 51 * HOUR)])).toBeNull();
    expect(findDuplicate(me, [stored('old', TEXT, 0)])).toBeNull();
  });

  test('a message not yet read by the model is not used as the original', () => {
    const unread = { message: message('a', TEXT, 0), record: null };
    expect(findDuplicate(message('b', TEXT, HOUR), [unread])).toBeNull();
  });

  test('with no match there is no duplicate', () => {
    expect(
      findDuplicate(message('b', 'Something else entirely today', HOUR), [
        stored('a', TEXT, 0),
      ]),
    ).toBeNull();
  });
});
