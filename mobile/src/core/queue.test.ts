import { recheckQueued, reminderTime } from './queue';
import type { Channel, Draft } from './types';

const draft: Draft = {
  id: 'd1',
  messageId: 'm1',
  text: 'Sure',
  firstText: 'Sure',
  status: 'approved',
};
const channel: Channel = {
  packageName: 'com.facebook.orca',
  label: 'Messenger',
  enabled: true,
  level: 2,
};

describe('recheckQueued', () => {
  test('an approved draft on a channel that allows replies is sent', () => {
    expect(recheckQueued(draft, channel)).toEqual({ outcome: 'send' });
  });

  test('a draft that is gone, discarded, or already sent needs the user', () => {
    expect(recheckQueued(null, channel).outcome).toBe('needs_you');
    expect(
      recheckQueued({ ...draft, status: 'discarded' }, channel).outcome,
    ).toBe('needs_you');
    expect(recheckQueued({ ...draft, status: 'sent' }, channel).outcome).toBe(
      'needs_you',
    );
  });

  test('a channel switched off or lowered to read-only needs the user', () => {
    expect(recheckQueued(draft, null).outcome).toBe('needs_you');
    expect(recheckQueued(draft, { ...channel, enabled: false }).outcome).toBe(
      'needs_you',
    );
    expect(recheckQueued(draft, { ...channel, level: 1 }).outcome).toBe(
      'needs_you',
    );
  });
});

describe('reminderTime', () => {
  const HOUR = 3_600_000;
  test('reminds an hour before the date', () => {
    expect(reminderTime(10 * HOUR, 0)).toBe(9 * HOUR);
  });
  test('reminds in a minute when the date is less than an hour away', () => {
    expect(reminderTime(HOUR / 2, 0)).toBe(60_000);
  });
  test('does not remind about a date that has passed', () => {
    expect(reminderTime(5, 10)).toBeNull();
  });
});
