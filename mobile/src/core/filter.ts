import type { CapturedNotification } from './types';

/**
 * Where the quick filter sends a message (spec 4.4): `drop` is never stored,
 * `promotion` and `chatter` are stored without a model call, `model` goes on
 * to extraction.
 */
export type FilterRoute = 'drop' | 'promotion' | 'chatter' | 'model';

/** Android notification categories that never carry a message. */
const DROP_CATEGORIES = new Set([
  'transport',
  'progress',
  'call',
  'missed_call',
  'service',
  'sys',
  'status',
  'alarm',
  'navigation',
  'stopwatch',
  'workout',
  'location_sharing',
]);

const SYSTEM_PACKAGES = new Set([
  'android',
  'com.android.systemui',
  'com.android.providers.downloads',
]);

/** Categories of apps that hold conversations: chat, social, and email. */
const CONVERSATION_CATEGORIES = new Set(['msg', 'social', 'email']);

/** School apps post plain notifications that are still worth reading. */
const SCHOOL_PACKAGES = new Set(['com.google.android.apps.classroom']);

const CHATTER_PATTERNS = [
  /\bsent (an? |\d+ )?(photos?|stickers?|gifs?|videos?|voice messages?|attachments?|files?)\b/i,
  /\breacted\b.*\bto (your|a) message\b/i,
  /^(liked|loved) (your|a) message\b/i,
];

export function quickFilter(notification: CapturedNotification, text: string): FilterRoute {
  const { category, isOngoing, packageName } = notification;

  if (isOngoing || SYSTEM_PACKAGES.has(packageName)) return 'drop';
  if (category && DROP_CATEGORIES.has(category)) return 'drop';

  if (category === 'promo') return 'promotion';
  if (!hasConversation(notification)) return 'promotion';

  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 3) return 'chatter';
  if (CHATTER_PATTERNS.some(pattern => pattern.test(text))) return 'chatter';

  return 'model';
}

function hasConversation(n: CapturedNotification): boolean {
  return (
    n.messages.length > 0 ||
    n.conversationTitle !== null ||
    n.canReply ||
    (n.category !== null && CONVERSATION_CATEGORIES.has(n.category)) ||
    SCHOOL_PACKAGES.has(n.packageName)
  );
}
