import type { CapturedNotification } from '../../core/types';

/**
 * A few notifications so the app shows something before the phone is wired
 * in. The full fixture set lives in core/__fixtures__ (task B1.1).
 */
export const SEED_NOTIFICATIONS: CapturedNotification[] = [
  {
    key: 'seed-1',
    packageName: 'com.facebook.orca',
    postedAt: Date.UTC(2026, 9, 10, 1, 0),
    title: 'CS 301 Block A',
    text: 'Prof. Reyes: Project proposal is due this Friday, 5 PM. Submit on the portal.',
    bigText: null,
    conversationTitle: 'CS 301 Block A',
    isGroup: true,
    messages: [
      {
        sender: 'Prof. Reyes',
        text: 'Project proposal is due this Friday, 5 PM. Submit on the portal.',
        time: Date.UTC(2026, 9, 10, 1, 0),
      },
    ],
    category: 'msg',
    isOngoing: false,
    canReply: true,
  },
  {
    key: 'seed-2',
    packageName: 'com.facebook.orca',
    postedAt: Date.UTC(2026, 9, 10, 1, 20),
    title: 'Maya Chen',
    text: 'Can we move our group meeting to tomorrow afternoon?',
    bigText: null,
    conversationTitle: null,
    isGroup: false,
    messages: [],
    category: 'msg',
    isOngoing: false,
    canReply: true,
  },
  {
    key: 'seed-3',
    packageName: 'com.google.android.gm',
    postedAt: Date.UTC(2026, 9, 10, 2, 5),
    title: 'University Cashier',
    text: 'Tuition balance of PHP 12,500 is due on October 15.',
    bigText:
      'Tuition balance of PHP 12,500 is due on October 15. Pay at the cashier or through the student portal to avoid a late fee.',
    conversationTitle: null,
    isGroup: false,
    messages: [],
    category: 'email',
    isOngoing: false,
    canReply: false,
  },
];
