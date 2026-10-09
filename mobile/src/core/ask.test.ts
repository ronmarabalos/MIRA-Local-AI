import { ASK_WINDOW_MS, searchMessages } from './ask';
import type { ReportItem } from './report';
import type { MiraRecord } from './types';

const NOW = Date.UTC(2026, 9, 10, 12, 0);
const HOUR = 3_600_000;

let next = 0;
function item(
  text: string,
  record: Partial<MiraRecord> = {},
  opts: {
    sender?: string;
    chat?: string;
    hoursAgo?: number;
    status?: 'processed' | 'failed' | 'new';
  } = {},
): ReportItem {
  const id = `m${++next}`;
  const status = opts.status ?? 'processed';
  return {
    message: {
      id,
      notificationKey: id,
      packageName: 'com.facebook.orca',
      chatId: 'c1',
      sender: opts.sender ?? 'Carla',
      text,
      postedAt: NOW - (opts.hoursAgo ?? 1) * HOUR,
      truncated: false,
      canReply: true,
      status,
    },
    chat: {
      id: 'c1',
      packageName: 'com.facebook.orca',
      title: opts.chat ?? 'Carla',
      kind: 'private',
    },
    record:
      status === 'new'
        ? null
        : {
            messageId: id,
            type: 'request',
            summary: 'A message.',
            needsUser: true,
            urgency: 'normal',
            request: null,
            amount: null,
            dateText: null,
            dateAt: null,
            sensitive: false,
            instructionLike: false,
            duplicateOf: null,
            ...record,
          },
  };
}

const fee = () =>
  item(
    'Hi! Your org fee of 150 pesos is due this Friday, please pay at the booth.',
    {
      type: 'payment',
      summary: 'Org fee of 150 pesos is due Friday.',
      dateText: 'this Friday',
      amount: '150 pesos',
    },
  );
const ids = (question: string, items: ReportItem[]) =>
  searchMessages(question, items, NOW).map(m => m.item.message.id);

describe('matching', () => {
  test("finds the message that shares the question's words", () => {
    const target = fee();
    const other = item('Class tomorrow is moved online.');
    expect(ids('when is the org fee due?', [other, target])).toEqual([
      target.message.id,
    ]);
  });

  test('a word in the message text counts more than one only in the summary or a name', () => {
    const inText = item('The proposal is ready for review.');
    const inSummary = item('Please check the file I sent.', {
      summary: 'Asks you to check the proposal.',
    });
    const inName = item('See you later then.', {}, { chat: 'Proposal Group' });
    const matches = searchMessages(
      'proposal',
      [inName, inSummary, inText],
      NOW,
    );
    expect(matches.map(m => m.score)).toEqual([3, 2, 2]);
    expect(matches[0].item.message.id).toBe(inText.message.id);
  });

  test('related words match across English and Filipino', () => {
    const target = item('Kailan mo babayaran yung utang mo?', {
      type: 'payment',
    });
    expect(ids('do I have a payment to make?', [target])).toEqual([
      target.message.id,
    ]);
  });

  test('plural and singular match', () => {
    const target = item('The fees were updated this week.');
    expect(ids('fee', [target])).toEqual([target.message.id]);
  });

  test('filler words do not make a match', () => {
    const unrelated = item('Lunch is at the canteen.');
    expect(ids('what is the thing about my class?', [unrelated])).toEqual([]);
  });

  test('a question of only filler words, punctuation, or emoji finds nothing', () => {
    const any = fee();
    expect(ids('ano ba?', [any])).toEqual([]);
    expect(ids('???', [any])).toEqual([]);
    expect(ids('🙂', [any])).toEqual([]);
    expect(ids('', [any])).toEqual([]);
  });

  test('a very long question is cut before searching and still works', () => {
    const target = fee();
    const question = `fee ${'blah '.repeat(500)} proposal`;
    expect(question.length).toBeGreaterThan(300);
    expect(ids(question, [target, item('The proposal is ready.')])).toEqual([
      target.message.id,
    ]);
  });
});

describe('what the question asks for', () => {
  test('"when" favours a message with a date and reports the date', () => {
    const withDate = fee();
    const without = item('Did you pay the org fee already?', {
      type: 'question',
    });
    const [first] = searchMessages(
      'when is the org fee due?',
      [without, withDate],
      NOW,
    );
    expect(first.item.message.id).toBe(withDate.message.id);
    expect(first.fact).toEqual({ kind: 'date', text: 'this Friday' });
  });

  test('"how much" and "magkano" report the amount', () => {
    const target = fee();
    expect(
      searchMessages('how much is the org fee?', [target], NOW)[0].fact,
    ).toEqual({
      kind: 'amount',
      text: '150 pesos',
    });
    expect(
      searchMessages('magkano yung org fee?', [target], NOW)[0].fact?.kind,
    ).toBe('amount');
  });

  test('a question that asks for neither has no fact', () => {
    expect(searchMessages('org fee', [fee()], NOW)[0].fact).toBeNull();
  });

  test('the question word alone is not a match', () => {
    expect(ids('when?', [fee()])).toEqual([]);
    expect(ids('how much?', [fee()])).toEqual([]);
  });
});

describe('which messages can be found', () => {
  const question = 'org fee';
  const text = 'The org fee is due soon.';

  test('chatter, promotions, copies, hostile, unread, and failed messages are left out', () => {
    const excluded = [
      item(text, { type: 'chatter' }),
      item(text, { type: 'promotion' }),
      item(text, { duplicateOf: 'm0' }),
      item(text, { instructionLike: true }),
      item(text, {}, { status: 'new' }),
      item(text, {}, { status: 'failed' }),
    ];
    expect(ids(question, excluded)).toEqual([]);
  });

  test('only the last 14 days are searched', () => {
    const recent = item(text, {}, { hoursAgo: ASK_WINDOW_MS / HOUR - 1 });
    const old = item(text, {}, { hoursAgo: ASK_WINDOW_MS / HOUR + 1 });
    expect(ids(question, [old, recent])).toEqual([recent.message.id]);
  });

  test('at most five are returned, best first, newest first on a tie', () => {
    const many = Array.from({ length: 7 }, (_, i) =>
      item(text, {}, { hoursAgo: i + 1 }),
    );
    // Scores the same as the others (a word counts once), and is the oldest, so it is not in the five.
    const older = item(
      'Org fee: pay the org fee at the booth.',
      { summary: 'Org fee reminder.' },
      { hoursAgo: 20, chat: 'Org' },
    );
    const found = ids(question, [...many, older]);
    expect(found).toHaveLength(5);
    expect(found.slice(0, 2)).toEqual([many[0].message.id, many[1].message.id]);
    expect(found).not.toContain(older.message.id);
  });
});

describe('words that should not be searched for', () => {
  test('the leftover letter of a contraction does not match', () => {
    const other = item("It's Carla's turn to present today.");
    expect(ids("what's that?", [other])).toEqual([]);
    expect(ids("when's the fee due?", [other])).toEqual([]);
  });

  test('"next" does not make an unrelated message a match', () => {
    const gym = item('See you next week at the gym.', {
      dateText: 'next week',
    });
    const deadline = item('Submit your project on oct 12 at 11:59pm.', {
      type: 'deadline',
      dateText: 'oct 12',
    });
    expect(ids('When is the next deadline?', [gym, deadline])).toEqual([
      deadline.message.id,
    ]);
  });

  test('Filipino question forms are understood: anong, kelan', () => {
    const meeting = item('Meeting tayo bukas ng 3pm sa library.', {
      dateText: 'bukas ng 3pm',
    });
    const food = item('Anong ulam natin mamaya sa bahay?');
    expect(ids('anong oras ang meeting?', [food, meeting])).toEqual([
      meeting.message.id,
    ]);
    expect(
      searchMessages('kelan ang meeting?', [meeting], NOW)[0].fact?.kind,
    ).toBe('date');
  });
});
