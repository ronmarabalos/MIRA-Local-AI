import type { Channel, Draft } from './types';

export type Recheck =
  | { outcome: 'send' }
  | { outcome: 'needs_you'; reason: string };

/**
 * Checks a queued reply again before it is sent after the connection returns
 * (spec 4.9): the draft must still be approved and the app must still allow
 * replies. Whether the notification is still showing is only known by trying.
 */
export function recheckQueued(
  draft: Draft | null,
  channel: Channel | null,
): Recheck {
  if (!draft || draft.status !== 'approved') {
    return {
      outcome: 'needs_you',
      reason: 'The draft is no longer waiting to be sent.',
    };
  }
  if (!channel || !channel.enabled || channel.level < 2) {
    return {
      outcome: 'needs_you',
      reason: 'This app no longer allows replies from MIRA.',
    };
  }
  return { outcome: 'send' };
}

export const GONE_REASON =
  'The notification is no longer showing. Copy the reply and open the chat to send it.';

const HOUR = 60 * 60 * 1000;
const MINUTE = 60 * 1000;

/**
 * When to remind about a date: an hour before, or in a minute if that hour
 * has already begun. Null when the date itself has passed.
 */
export function reminderTime(dateAt: number, now: number): number | null {
  if (dateAt <= now) return null;
  return Math.max(dateAt - HOUR, now + MINUTE);
}
