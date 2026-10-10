import { questionWindow, resolveDate, resolveInMessage, resolveWhen } from './dates';

// Local time, so the tests hold in any time zone. Saturday 10 October 2026.
const posted = new Date(2026, 9, 10, 9, 0).getTime();
const local = (month: number, day: number, hour = 12, minute = 0) =>
  new Date(2026, month - 1, day, hour, minute).getTime();

describe('resolveDate', () => {
  it('resolves a weekday and time after the post time', () => {
    expect(resolveDate('this Friday, 5 PM', posted)).toBe(local(10, 16, 17));
  });

  it('resolves a calendar date', () => {
    expect(resolveDate('Oct 20 at 3pm', posted)).toBe(local(10, 20, 15));
  });

  it('resolves relative to the post time, not today', () => {
    const earlier = new Date(2026, 0, 5, 9, 0).getTime();
    expect(resolveDate('tomorrow', earlier)).toBe(
      new Date(2026, 0, 6, 9, 0).getTime(),
    );
  });

  it('resolves Tagalog day words', () => {
    // "Tomorrow" keeps the post's time of day; a weekday defaults to noon.
    expect(resolveDate('bukas', posted)).toBe(local(10, 11, 9));
    expect(resolveDate('sa Lunes', posted)).toBe(local(10, 12));
    expect(resolveDate('Biyernes', posted)).toBe(local(10, 16));
  });

  it('returns null for a phrase it cannot resolve', () => {
    expect(resolveDate('asap', posted)).toBeNull();
    expect(resolveDate('', posted)).toBeNull();
  });
});

describe('resolveInMessage', () => {
  it('takes the day from the message when the phrase holds only a time', () => {
    expect(
      resolveInMessage(
        '11:59pm',
        'oct 17, lets play tennis at 11:59pm',
        posted,
      ),
    ).toBe(local(10, 17, 23, 59));
    expect(
      resolveInMessage(
        '11:59pm',
        'oct 12, Submit your project at 11:59pm',
        posted,
      ),
    ).toBe(local(10, 12, 23, 59));
  });

  it('uses the phrase alone when it already names a day', () => {
    expect(
      resolveInMessage(
        'this Friday, 5 PM',
        'Moved from oct 12 to this Friday, 5 PM',
        posted,
      ),
    ).toBe(local(10, 16, 17));
    expect(
      resolveInMessage(
        'Oct 20 at 3pm',
        'See you Oct 20 at 3pm, not oct 12',
        posted,
      ),
    ).toBe(local(10, 20, 15));
  });

  it('keeps a time-only phrase on the day it was posted when the message names no day', () => {
    expect(
      resolveInMessage('11:59pm', 'submit it at 11:59pm please', posted),
    ).toBe(local(10, 10, 23, 59));
  });

  it('reads a Tagalog day in the message for a time-only phrase', () => {
    expect(
      resolveInMessage('3pm', 'Meeting tayo bukas ng 3pm sa library', posted),
    ).toBe(local(10, 11, 15));
  });

  it('takes a day named in the message when the phrase resolves to nothing', () => {
    expect(
      resolveInMessage('the deadline', 'the deadline is oct 20', posted),
    ).toBe(local(10, 20));
  });

  it('returns null when neither the phrase nor the message names a date or time', () => {
    expect(resolveInMessage('asap', 'do it asap', posted)).toBeNull();
  });
});

describe('resolveWhen', () => {
  it('says whether the message actually gave a time of day', () => {
    expect(resolveWhen('oct 12', 'oct 12 is the deadline', posted)).toEqual({
      at: local(10, 12),
      hasTime: false,
    });
    expect(
      resolveWhen('11:59pm', 'oct 12, Submit your project at 11:59pm', posted),
    ).toEqual({
      at: local(10, 12, 23, 59),
      hasTime: true,
    });
    expect(resolveWhen('Friday', 'see you Friday', posted)?.hasTime).toBe(
      false,
    );
    expect(
      resolveWhen('this Friday, 5 PM', 'this Friday, 5 PM', posted)?.hasTime,
    ).toBe(true);
    expect(resolveWhen('asap', 'do it asap', posted)).toBeNull();
  });
});

describe('questionWindow', () => {
  // Saturday 10 October 2026, 3 PM, in the phone's own time zone.
  const now = new Date(2026, 9, 10, 15, 0).getTime();
  const day = (d: number, m = 9) => new Date(2026, m, d).getTime();
  const range = (q: string) => {
    const w = questionWindow(q, now);
    return w && [w.from, w.to];
  };

  test('today, tomorrow, and yesterday are whole days', () => {
    expect(range('anything today?')).toEqual([day(10), day(11)]);
    expect(range('what is due tomorrow')).toEqual([day(11), day(12)]);
    expect(range('what did they say yesterday?')).toEqual([day(9), day(10)]);
  });

  test('this week runs from Monday through the next seven days; next week is Monday to Monday', () => {
    expect(range("what's due this week?")).toEqual([day(5), day(17)]);
    expect(range('any exams next week')).toEqual([day(12), day(19)]);
  });

  test('the weekend, this month, and next month', () => {
    expect(range('plans this weekend?')).toEqual([day(10), day(12)]);
    expect(range('payments this month')).toEqual([day(1), day(1, 10)]);
    expect(range('anything next month')).toEqual([day(1, 10), day(1, 11)]);
  });

  test('a named day is that one day', () => {
    expect(range('what is on friday?')).toEqual([day(16), day(17)]);
    expect(range('due oct 20?')).toEqual([day(20), day(21)]);
  });

  test('Tagalog words work too', () => {
    expect(range('may klase ba bukas?')).toEqual([day(11), day(12)]);
    expect(range('ano ang sinabi kahapon')).toEqual([day(9), day(10)]);
    expect(range('ano ang deadline ngayong linggo?')).toEqual([day(5), day(17)]);
    expect(range('meron ba sa susunod na linggo')).toEqual([day(12), day(19)]);
  });

  test('the matched words are reported, so they are not searched for', () => {
    expect(questionWindow("what's due this week?", now)?.phrase.toLowerCase()).toBe('this week');
  });

  test('a question with no time in it has no window', () => {
    expect(questionWindow('how much is the org fee?', now)).toBeNull();
  });
});
