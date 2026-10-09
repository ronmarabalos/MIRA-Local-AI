import { resolveDate } from './dates';

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
    expect(resolveDate('tomorrow', earlier)).toBe(new Date(2026, 0, 6, 9, 0).getTime());
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
