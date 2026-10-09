import { resolveDate, resolveInMessage } from './dates';

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
