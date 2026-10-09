# Inbox and Planner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Inbox and Planner tabs show the user's stored messages and the dates found in them, in place of their "nothing here" states.

**Architecture:** Two pure modules in `core/` turn stored items into what each tab shows: `inbox.ts` filters and counts messages, `planner.ts` turns dated messages into entries, groups them by local day, and builds a month grid. The three screens read storage through the existing `useQuery` hook, which re-runs after every write, so the tabs fill in as messages arrive. No new storage, no model call, no new permission.

**Tech Stack:** React Native 0.87, TypeScript, Jest with `react-test-renderer`, NativeWind classes, the existing SQLite store and its in-memory test double (`mobile/test-support/sqlite.ts`).

**Spec:** [`docs/specs/2026-10-10-inbox-planner-design.md`](2026-10-10-inbox-planner-design.md). Read it before starting.

## Global Constraints

- Every row and every date opens the original message. Rows are the shared `ReportItem`, which already does this.
- A message that tried to give instructions is never shown as something to do or as a date.
- Nothing leaves the phone. No new permission, no new storage, no model call.
- No technical terms in the interface. No raw colours or one-off sizes in screens: use existing classes.
- Copy in code uses the typographic apostrophe (’), as the rest of the app does.
- Fixed copy:
  - Inbox: `Every message MIRA has read, newest first.` · `Nothing here yet` / `Messages from the apps you switch on will be listed here.` · `No messages match this filter` · `Show more`
  - Planner: `Nothing coming up` / `Dates MIRA finds in your messages will appear here.` · group titles `Today`, `Tomorrow`, `This week`, `Later`, `No exact date`, `Passed` · `Reminder set`
  - Both: `Your messages could not be loaded. Tap to try again.` · `Loading…`
- The Inbox and Planner look at messages stored in the last 30 days. The Inbox shows 50 rows at a time.
- The week starts on Sunday. All day arithmetic uses the phone's local time through `Date`.
- Tests are written before the code they cover. Run one file with `npm --prefix mobile test -- <path relative to mobile/>`; run everything with `npm --prefix mobile test`. Type-check with `npx tsc --noEmit` in `mobile/`.
- Commit messages carry no AI attribution (see `AGENTS.md`).
- Work on a branch named `steve/inbox-planner`, rebased on `main` before merging.

## Review Focus

1. **A date just before or just after midnight:** an entry at 11:59 PM today is Today and one at 12:01 AM is Tomorrow, whatever the hour is now. Pinned in Task 3.
2. **Month edges:** February in a leap year and not, a month starting on Sunday, and stepping from December to January and back. Pinned in Tasks 3 and 5.
3. **Hostile messages and copies:** never an entry, never under Needs you or With a date; a copy is never a row of its own. Pinned in Tasks 1 and 3.
4. **A long history:** only 50 Inbox rows are rendered until "Show more" is pressed, and changing a filter goes back to 50. Pinned in Task 2.
5. **Storage that cannot be read:** each tab shows the try-again line and does not crash. Pinned in Tasks 2 and 4.

---

## File Structure

| File | Responsibility |
| :--- | :--- |
| `mobile/src/core/inbox.ts` (new) | Which stored messages the Inbox lists, the counts on its pills, and each row's label line |
| `mobile/src/core/inbox.test.ts` (new) | Inbox logic tests |
| `mobile/src/screens/Inbox/index.tsx` | The Inbox tab |
| `mobile/__tests__/inbox.test.tsx` (new) | Inbox screen tests |
| `mobile/src/core/planner.ts` (new) | Dated messages as entries; grouping by local day; the month grid |
| `mobile/src/core/planner.test.ts` (new) | Planner logic tests |
| `mobile/src/screens/Planner/entries.tsx` (new) | The shared query and row used by both Planner views |
| `mobile/src/screens/Planner/TasksView.tsx` | The upcoming list |
| `mobile/src/screens/Planner/CalendarView.tsx` | The month view |
| `mobile/__tests__/planner.test.tsx` (new) | Planner screen tests |
| `mobile/__tests__/screens.test.tsx` | Expectations for the three boards |
| `docs/PLAN.md` | Task entries |

---

### Task 1: Inbox logic

**Files:**
- Create: `mobile/src/core/inbox.ts`
- Test: `mobile/src/core/inbox.test.ts`

**Interfaces:**
- Consumes: `ReportItem` and `Seen` from `mobile/src/core/report.ts`; `RecordType` from `mobile/src/core/types.ts`.
- Produces:
  - `type InboxFilter = 'all' | 'needs' | 'dated' | 'ignored'`
  - `interface Inbox { rows: ReportItem[]; counts: Record<InboxFilter, number>; apps: { packageName: string; count: number }[] }`
  - `buildInbox(items: ReportItem[], options: { filter: InboxFilter; packageName: string | null }): Inbox`
  - `labelLine(item: ReportItem, time: string): string`
  - `TYPE_LABELS: Record<RecordType, string>`

- [ ] **Step 1: Write the failing tests**

Create `mobile/src/core/inbox.test.ts`:

```ts
import { buildInbox, labelLine } from './inbox';
import type { ReportItem } from './report';
import type { MiraRecord } from './types';

const MESSENGER = 'com.facebook.orca';
const GMAIL = 'com.google.android.gm';

let next = 0;
function item(
  record: Partial<MiraRecord> = {},
  opts: { packageName?: string; chatId?: string; minute?: number; status?: 'processed' | 'filtered' | 'failed' | 'new' } = {},
): ReportItem {
  const id = `m${++next}`;
  const packageName = opts.packageName ?? MESSENGER;
  const chatId = opts.chatId ?? `${packageName}:chat`;
  const status = opts.status ?? 'processed';
  return {
    message: {
      id,
      notificationKey: id,
      packageName,
      chatId,
      sender: 'Carla',
      text: 'text',
      postedAt: (opts.minute ?? next) * 60_000,
      truncated: false,
      canReply: true,
      status,
    },
    chat: { id: chatId, packageName, title: 'Chat', kind: 'private' },
    record:
      status === 'new'
        ? null
        : {
            messageId: id,
            type: 'request',
            summary: 'summary',
            needsUser: false,
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

const all = { filter: 'all' as const, packageName: null };
const ids = (items: ReportItem[]) => items.map(i => i.message.id);

describe('buildInbox', () => {
  test('lists every message newest first', () => {
    const older = item({}, { minute: 1 });
    const newer = item({}, { minute: 5 });
    expect(ids(buildInbox([older, newer], all).rows)).toEqual(ids([newer, older]));
  });

  test('each filter holds the right messages, and the counts cover all four at once', () => {
    const needs = item({ needsUser: true });
    const dated = item({ type: 'deadline', dateText: 'oct 12' });
    const both = item({ type: 'payment', needsUser: true, dateText: 'Friday' });
    const chatter = item({ type: 'chatter' }, { status: 'filtered' });
    const promo = item({ type: 'promotion' }, { status: 'filtered' });
    const plain = item();
    const items = [needs, dated, both, chatter, promo, plain];

    const rows = (filter: 'all' | 'needs' | 'dated' | 'ignored') =>
      ids(buildInbox(items, { filter, packageName: null }).rows).sort();
    expect(rows('needs')).toEqual(ids([needs, both]).sort());
    expect(rows('dated')).toEqual(ids([dated, both]).sort());
    expect(rows('ignored')).toEqual(ids([chatter, promo]).sort());
    expect(rows('all')).toHaveLength(6);
    expect(buildInbox(items, all).counts).toEqual({ all: 6, needs: 2, dated: 2, ignored: 2 });
  });

  test('a message that tried to give instructions is only under All', () => {
    const hostile = item({ needsUser: true, dateText: 'today', instructionLike: true });
    const inbox = (filter: 'all' | 'needs' | 'dated') =>
      buildInbox([hostile], { filter, packageName: null }).rows;
    expect(inbox('all')).toHaveLength(1);
    expect(inbox('needs')).toEqual([]);
    expect(inbox('dated')).toEqual([]);
  });

  test('a message still being read, or one that could not be read, is only under All', () => {
    const reading = item({}, { status: 'new' });
    const failed = item({ needsUser: true, dateText: 'x' }, { status: 'failed' });
    expect(buildInbox([reading, failed], all).counts).toEqual({ all: 2, needs: 0, dated: 0, ignored: 0 });
  });

  test('a copy is not a row; the first message says how often it was seen', () => {
    const first = item({ needsUser: true }, { chatId: 'a' });
    const sameChat = item({ needsUser: true, duplicateOf: first.message.id }, { chatId: 'a' });
    const otherChat = item({ needsUser: true, duplicateOf: first.message.id }, { chatId: 'b' });
    const inbox = buildInbox([first, sameChat, otherChat], all);
    expect(ids(inbox.rows)).toEqual([first.message.id]);
    expect(inbox.rows[0].seen).toEqual({ times: 3, chats: 2 });
    expect(inbox.counts.all).toBe(1);
  });

  test('apps are listed most first, and choosing one narrows the rows and the counts', () => {
    const a = item({ needsUser: true });
    const b = item();
    const mail = item({ needsUser: true }, { packageName: GMAIL });
    const items = [a, b, mail];
    expect(buildInbox(items, all).apps).toEqual([
      { packageName: MESSENGER, count: 2 },
      { packageName: GMAIL, count: 1 },
    ]);
    const onlyMail = buildInbox(items, { filter: 'all', packageName: GMAIL });
    expect(ids(onlyMail.rows)).toEqual([mail.message.id]);
    expect(onlyMail.counts).toEqual({ all: 1, needs: 1, dated: 0, ignored: 0 });
    // The app list itself does not shrink, so the other pills stay available.
    expect(onlyMail.apps).toHaveLength(2);
  });

  test('with nothing stored there are no rows, zero counts, and no apps', () => {
    expect(buildInbox([], all)).toEqual({
      rows: [],
      counts: { all: 0, needs: 0, dated: 0, ignored: 0 },
      apps: [],
    });
  });
});

describe('labelLine', () => {
  test('a read message shows its type, whether it needs you, its date phrase, and the time', () => {
    expect(labelLine(item({ type: 'deadline', needsUser: true, dateText: 'oct 12' }), '5:08 AM')).toBe(
      'Deadline · Needs you · oct 12 · 5:08 AM',
    );
    expect(labelLine(item({ type: 'schedule_change' }), '5:08 AM')).toBe('Schedule change · 5:08 AM');
  });

  test('each other state has its own line', () => {
    expect(labelLine(item({ type: 'chatter' }, { status: 'filtered' }), '5:08 AM')).toBe('Ignored · Chatter · 5:08 AM');
    expect(labelLine(item({ needsUser: true, instructionLike: true }), '5:08 AM')).toBe('Blocked · 5:08 AM');
    expect(labelLine(item({}, { status: 'new' }), '5:08 AM')).toBe('Reading… · 5:08 AM');
    expect(labelLine(item({}, { status: 'failed' }), '5:08 AM')).toBe('Couldn’t read · 5:08 AM');
  });
});
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `npm --prefix mobile test -- src/core/inbox.test.ts`
Expected: FAIL, "Cannot find module './inbox'".

- [ ] **Step 3: Write the logic**

Create `mobile/src/core/inbox.ts`:

```ts
import type { ReportItem } from './report';
import type { RecordType } from './types';

export type InboxFilter = 'all' | 'needs' | 'dated' | 'ignored';

export interface Inbox {
  /** The chosen filter's messages, newest first. A merged first message carries `seen`. */
  rows: ReportItem[];
  /** How many messages each filter holds, for the chosen app. */
  counts: Record<InboxFilter, number>;
  /** Every app with at least one message, most first. Not narrowed by the chosen app. */
  apps: { packageName: string; count: number }[];
}

export const TYPE_LABELS: Record<RecordType, string> = {
  request: 'Request',
  question: 'Question',
  deadline: 'Deadline',
  payment: 'Payment',
  schedule_change: 'Schedule change',
  announcement: 'Announcement',
  chatter: 'Chatter',
  promotion: 'Promotion',
  other: 'Other',
};

/** True once the model, or the quick filter, has described the message. */
const wasRead = (item: ReportItem) =>
  item.record !== null && item.message.status !== 'new' && item.message.status !== 'failed';

const isIgnored = (item: ReportItem) =>
  item.record?.type === 'chatter' || item.record?.type === 'promotion';

const MEMBER: Record<InboxFilter, (item: ReportItem) => boolean> = {
  all: () => true,
  needs: item =>
    wasRead(item) && !!item.record?.needsUser && !isIgnored(item) && !item.record?.instructionLike,
  dated: item =>
    wasRead(item) && !!item.record && item.record.dateText !== null && !item.record.instructionLike,
  ignored: item => wasRead(item) && isIgnored(item),
};

/**
 * What the Inbox shows (Inbox and Planner spec, section 2): every stored
 * message except copies, newest first, narrowed by a filter and an app.
 */
export function buildInbox(
  items: ReportItem[],
  options: { filter: InboxFilter; packageName: string | null },
): Inbox {
  const copies = new Map<string, ReportItem[]>();
  for (const item of items) {
    const originalId = item.record?.duplicateOf;
    if (originalId) copies.set(originalId, [...(copies.get(originalId) ?? []), item]);
  }
  const originals = items
    .filter(item => !item.record?.duplicateOf)
    .map(item => {
      const again = copies.get(item.message.id);
      if (!again) return item;
      const chats = new Set([item.chat.id, ...again.map(copy => copy.chat.id)]);
      return { ...item, seen: { times: again.length + 1, chats: chats.size } };
    });

  const perApp = new Map<string, number>();
  for (const item of originals) {
    perApp.set(item.message.packageName, (perApp.get(item.message.packageName) ?? 0) + 1);
  }
  const apps = [...perApp.entries()]
    .map(([packageName, count]) => ({ packageName, count }))
    .sort((a, b) => b.count - a.count || a.packageName.localeCompare(b.packageName));

  const inApp = options.packageName
    ? originals.filter(item => item.message.packageName === options.packageName)
    : originals;
  const count = (filter: InboxFilter) => inApp.filter(MEMBER[filter]).length;

  return {
    rows: inApp
      .filter(MEMBER[options.filter])
      .sort((a, b) => b.message.postedAt - a.message.postedAt),
    counts: { all: count('all'), needs: count('needs'), dated: count('dated'), ignored: count('ignored') },
    apps,
  };
}

/** The line of labels above a row's sender: what kind of message it is, and when it arrived. */
export function labelLine(item: ReportItem, time: string): string {
  const { message, record } = item;
  let parts: string[];
  if (record === null || message.status === 'new') parts = ['Reading…'];
  else if (message.status === 'failed') parts = ['Couldn’t read'];
  else if (record.instructionLike) parts = ['Blocked'];
  else if (isIgnored(item)) parts = ['Ignored', TYPE_LABELS[record.type]];
  else {
    parts = [TYPE_LABELS[record.type]];
    if (record.needsUser) parts.push('Needs you');
    if (record.dateText) parts.push(record.dateText);
  }
  return [...parts, time].join(' · ');
}
```

- [ ] **Step 4: Run the tests to see them pass**

Run: `npm --prefix mobile test -- src/core/inbox.test.ts`
Expected: PASS, 9 tests.

- [ ] **Step 5: Commit**

```bash
git add mobile/src/core/inbox.ts mobile/src/core/inbox.test.ts
git commit -m "feat: inbox logic, filters, counts, and row labels"
```

---

### Task 2: The Inbox screen

**Files:**
- Modify (replace contents): `mobile/src/screens/Inbox/index.tsx`
- Test: `mobile/__tests__/inbox.test.tsx` (new)
- Modify: `mobile/__tests__/screens.test.tsx` (the `13 inbox` row)

**Interfaces:**
- Consumes: `buildInbox`, `labelLine`, `InboxFilter` from Task 1; `useQuery`, `useChannels` from `services/db/hooks`; `Store.getItems(from, to, limit)`; components `Screen`, `ReportItem`, `EmptyState` (from `components/EmptyBoard`), `FilterPills`, `Tap`, `T`.
- Produces: the default export `InboxScreen`, already registered as the `Inbox` tab.

- [ ] **Step 1: Write the failing screen tests**

Create `mobile/__tests__/inbox.test.tsx`:

```tsx
import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { MiraRecord } from '../src/core/types';
import InboxScreen from '../src/screens/Inbox';
import { getStore } from '../src/services/db';
import { PrefsProvider } from '../src/theme/prefs';
import { testStore } from '../test-support/sqlite';

jest.mock('../src/services/db', () => ({ getStore: jest.fn() }));

const Stack = createNativeStackNavigator();
let db: Awaited<ReturnType<typeof testStore>>;
let tree: Renderer.ReactTestRenderer | undefined;
const now = Date.now();

async function add(
  id: string,
  summary: string,
  record: Partial<MiraRecord> = {},
  opts: { packageName?: string; minutesAgo?: number; status?: 'processed' | 'filtered' } = {},
) {
  const packageName = opts.packageName ?? 'com.facebook.orca';
  await db.store.addMessage(
    {
      id,
      notificationKey: id,
      packageName,
      chatId: `${packageName}:c1`,
      sender: 'Carla',
      text: `Original ${id}`,
      postedAt: now - (opts.minutesAgo ?? 1) * 60_000,
      truncated: false,
      canReply: true,
      status: 'processed',
    },
    { id: `${packageName}:c1`, packageName, title: 'ACM Org', kind: 'group' },
  );
  await db.store.saveRecord(
    {
      messageId: id,
      type: 'request',
      summary,
      needsUser: false,
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
    opts.status ?? 'processed',
  );
}

beforeEach(async () => {
  db = await testStore();
  jest.mocked(getStore).mockResolvedValue(db.store);
  await db.store.saveChannel({ packageName: 'com.facebook.orca', label: 'Messenger', enabled: true, level: 2 });
  await db.store.saveChannel({ packageName: 'com.google.android.gm', label: 'Gmail', enabled: true, level: 1 });
});

afterEach(async () => {
  if (tree) await act(() => tree!.unmount());
  tree = undefined;
  db.close();
  jest.restoreAllMocks();
});

const settle = () =>
  act(async () => {
    for (let i = 0; i < 8; i += 1) await new Promise<void>(resolve => setTimeout(resolve, 0));
  });

async function render() {
  await act(() => {
    tree = Renderer.create(
      <SafeAreaProvider>
        <PrefsProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Inbox" component={InboxScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </PrefsProvider>
      </SafeAreaProvider>,
    );
  });
  await settle();
}

function shown(): string {
  const text = (
    node: Renderer.ReactTestRendererJSON | Renderer.ReactTestRendererJSON[] | string | null,
  ): string => {
    if (node === null) return '';
    if (typeof node === 'string') return node;
    if (Array.isArray(node)) return node.map(text).join(' ');
    return (node.children ?? []).map(text).join(' ');
  };
  return text(tree!.toJSON());
}

async function press(label: string) {
  const button = tree!.root
    .findAllByProps({ accessibilityLabel: label })
    .find(node => typeof node.props.onPress === 'function');
  expect(button).toBeDefined();
  await act(() => {
    button!.props.onPress();
  });
  await settle();
}

test('lists stored messages with their label line, source, and app name', async () => {
  await add('m1', 'Project is due on October 12.', { type: 'deadline', needsUser: true, dateText: 'oct 12' });
  await add('m2', 'Just saying hi.', { type: 'chatter' }, { status: 'filtered', minutesAgo: 5 });
  await render();
  const text = shown();
  expect(text).toContain('Project is due on October 12.');
  expect(text).toContain('Deadline · Needs you · oct 12 ·');
  expect(text).toContain('Ignored · Chatter ·');
  expect(text).toContain('Messenger · ACM Org');
  expect(text).not.toContain('com.facebook.orca');
});

test('a filter narrows the list, and one with nothing in it says so', async () => {
  await add('m1', 'Project is due on October 12.', { type: 'deadline', needsUser: true, dateText: 'oct 12' });
  await add('m2', 'Just saying hi.', { type: 'chatter' }, { status: 'filtered' });
  await render();
  await press('Ignored');
  expect(shown()).toContain('Just saying hi.');
  expect(shown()).not.toContain('Project is due on October 12.');

  await press('Needs you');
  expect(shown()).toContain('Project is due on October 12.');
  expect(shown()).not.toContain('Just saying hi.');
});

test('app pills appear only when more than one app has messages, and narrow the list', async () => {
  await add('m1', 'From the chat.');
  await render();
  expect(tree!.root.findAllByProps({ accessibilityLabel: 'All apps' })).toHaveLength(0);
  await act(() => tree!.unmount());

  await add('m2', 'From the mail.', {}, { packageName: 'com.google.android.gm' });
  await render();
  await press('Gmail');
  expect(shown()).toContain('From the mail.');
  expect(shown()).not.toContain('From the chat.');
});

test('shows 50 rows until Show more is pressed, and a filter change goes back to 50', async () => {
  for (let i = 1; i <= 55; i += 1) {
    await add(`m${i}`, `Summary number ${String(i).padStart(2, '0')}.`, { needsUser: true }, { minutesAgo: i });
  }
  await render();
  const count = () => (shown().match(/Summary number/g) ?? []).length;
  expect(count()).toBe(50);
  await press('Show more');
  expect(count()).toBe(55);
  await press('Needs you');
  expect(count()).toBe(50);
});

test('with nothing stored it says so', async () => {
  await render();
  expect(shown()).toContain('Nothing here yet');
});

test('a filter with no messages says so', async () => {
  await add('m1', 'From the chat.');
  await render();
  await press('Ignored');
  expect(shown()).toContain('No messages match this filter');
});

test('when storage cannot be read it offers to try again and does not crash', async () => {
  jest.mocked(getStore).mockRejectedValue(new Error('disk'));
  await render();
  expect(shown()).toContain('Your messages could not be loaded.');
  expect(tree!.root.findAllByProps({ accessibilityLabel: 'Try again' }).length).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `npm --prefix mobile test -- __tests__/inbox.test.tsx`
Expected: FAIL. The screen is the "Nothing here right now" empty state, so only tests that expect an empty state could pass; the list, filter, paging, and error tests fail.

- [ ] **Step 3: Write the screen**

Replace the contents of `mobile/src/screens/Inbox/index.tsx` with:

```tsx
/** Board 13-inbox: every message MIRA has stored, newest first, narrowed by a filter or an app. */
import { useState } from 'react';
import { View } from 'react-native';

import { EmptyState } from '../../components/EmptyBoard';
import { ReportItem } from '../../components/ReportItem';
import { Screen } from '../../components/Screen';
import { T } from '../../components/T';
import { FilterPills, Tap } from '../../components/ui';
import { buildInbox, type InboxFilter, labelLine } from '../../core/inbox';
import { useChannels, useQuery } from '../../services/db/hooks';

const DAY = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 30;
const PAGE = 50;
/** A ceiling on what is loaded, not on what is drawn: only PAGE rows are drawn at a time. */
const MAX_ITEMS = 2000;
const ALL_APPS = 'all';

const timeOf = (at: number) =>
  new Date(at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

export default function InboxScreen() {
  const [filter, setFilter] = useState<InboxFilter>('all');
  const [app, setApp] = useState(ALL_APPS);
  const [shown, setShown] = useState(PAGE);
  const stored = useQuery(store => {
    const now = Date.now();
    // A day ahead as well: a message can carry a time slightly ahead of this phone's clock.
    return store.getItems(now - WINDOW_DAYS * DAY, now + DAY, MAX_ITEMS);
  }, []);
  const { data: channels } = useChannels();

  const inbox = buildInbox(stored.data ?? [], {
    filter,
    packageName: app === ALL_APPS ? null : app,
  });
  const appName = (packageName: string) =>
    channels?.find(channel => channel.packageName === packageName)?.label ?? 'Another app';

  return (
    <Screen tab="Inbox">
      <View className="gap-4">
        <T accessibilityRole="header" className="text-30 font-medium tracking-[-0.9px]">Inbox</T>
        <T className="text-15 text-ink-2">Every message MIRA has read, newest first.</T>
      </View>

      <FilterPills<InboxFilter>
        label="Filter"
        value={filter}
        onChange={next => {
          setFilter(next);
          setShown(PAGE);
        }}
        items={[
          { id: 'all', label: 'All', count: inbox.counts.all },
          { id: 'needs', label: 'Needs you', count: inbox.counts.needs },
          { id: 'dated', label: 'With a date', count: inbox.counts.dated },
          { id: 'ignored', label: 'Ignored', count: inbox.counts.ignored },
        ]}
      />
      {inbox.apps.length > 1 ? (
        <FilterPills<string>
          label="App"
          value={app}
          onChange={next => {
            setApp(next);
            setShown(PAGE);
          }}
          items={[
            { id: ALL_APPS, label: 'All apps' },
            ...inbox.apps.map(entry => ({
              id: entry.packageName,
              label: appName(entry.packageName),
              count: entry.count,
            })),
          ]}
        />
      ) : null}

      {stored.error ? (
        <Tap label="Try again" onPress={stored.retry} className="rounded-16 bg-error-bg px-14 py-12">
          <T className="text-13 font-semibold text-error-ink">
            Your messages could not be loaded. Tap to try again.
          </T>
        </Tap>
      ) : stored.data === undefined ? (
        <T className="text-14 text-ink-2">Loading…</T>
      ) : stored.data.length === 0 ? (
        <EmptyState
          title="Nothing here yet"
          body="Messages from the apps you switch on will be listed here."
        />
      ) : inbox.rows.length === 0 ? (
        <EmptyState title="No messages match this filter" body="Choose another filter to see more." />
      ) : (
        <View>
          {inbox.rows.slice(0, shown).map(item => (
            <ReportItem
              key={item.message.id}
              item={item}
              appLabel={appName(item.message.packageName)}
              label={labelLine(item, timeOf(item.message.postedAt))}
            />
          ))}
          {inbox.rows.length > shown ? (
            <Tap
              label="Show more"
              onPress={() => setShown(shown + PAGE)}
              className="h-52 items-center justify-center rounded-16 border border-white/80 bg-white/60"
            >
              <T className="text-15 font-bold">Show more</T>
            </Tap>
          ) : null}
        </View>
      )}
    </Screen>
  );
}
```

- [ ] **Step 4: Update the board test and run**

In `mobile/__tests__/screens.test.tsx`, change the Inbox row to:

```ts
  ['13 inbox', InboxScreen, 'Every message MIRA has read, newest first.'],
```

Run: `npm --prefix mobile test -- __tests__/inbox.test.tsx __tests__/screens.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add mobile/src/screens/Inbox/index.tsx mobile/__tests__/inbox.test.tsx mobile/__tests__/screens.test.tsx
git commit -m "feat: Inbox tab lists stored messages with filters, apps, and paging"
```

---

### Task 3: Planner logic

**Files:**
- Create: `mobile/src/core/planner.ts`
- Test: `mobile/src/core/planner.test.ts`

**Interfaces:**
- Consumes: `ReportItem`, `ReportLine` from `mobile/src/core/report.ts`; `Action` from `mobile/src/core/types.ts`.
- Produces:
  - `interface PlannerEntry { item: ReportLine; at: number | null; reminder: boolean }`
  - `interface Planner { today: PlannerEntry[]; tomorrow: PlannerEntry[]; thisWeek: PlannerEntry[]; later: PlannerEntry[]; undated: PlannerEntry[]; passed: PlannerEntry[] }`
  - `plannerEntries(items: ReportItem[], actions: Action[]): PlannerEntry[]`
  - `groupEntries(entries: PlannerEntry[], now: number): Planner`
  - `interface DayCell { date: number; day: number; count: number; isToday: boolean }`
  - `monthGrid(year: number, month: number, entries: PlannerEntry[], now: number): (DayCell | null)[][]` (`month` is 0 to 11)
  - `entriesOn(date: number, entries: PlannerEntry[]): PlannerEntry[]`
  - `startOfLocalDay(time: number): number`

- [ ] **Step 1: Write the failing tests**

Create `mobile/src/core/planner.test.ts`:

```ts
import { entriesOn, groupEntries, monthGrid, plannerEntries, startOfLocalDay } from './planner';
import type { ReportItem } from './report';
import type { Action, MiraRecord } from './types';

// Local time throughout, as the app uses: Saturday 10 October 2026, 2:00 PM.
const at = (day: number, hour = 12, minute = 0, month = 9, year = 2026) =>
  new Date(year, month, day, hour, minute).getTime();
const NOW = at(10, 14);

let next = 0;
function item(dateAt: number | null, record: Partial<MiraRecord> = {}, minutesAgo = 1): ReportItem {
  const id = `m${++next}`;
  return {
    message: {
      id,
      notificationKey: id,
      packageName: 'com.facebook.orca',
      chatId: 'c1',
      sender: 'Carla',
      text: 'text',
      postedAt: NOW - minutesAgo * 60_000,
      truncated: false,
      canReply: true,
      status: 'processed',
    },
    chat: { id: 'c1', packageName: 'com.facebook.orca', title: 'Chat', kind: 'private' },
    record: {
      messageId: id,
      type: 'deadline',
      summary: `summary ${id}`,
      needsUser: true,
      urgency: 'normal',
      request: null,
      amount: null,
      dateText: 'a date',
      dateAt,
      sensitive: false,
      instructionLike: false,
      duplicateOf: null,
      ...record,
    },
  };
}

const remind = (messageId: string, status: Action['status'] = 'done'): Action => ({
  id: `a-${messageId}`,
  ruleId: 'builtin-remind',
  messageId,
  kind: 'remind',
  payload: {},
  status,
  reason: null,
  createdAt: NOW,
  doneAt: NOW,
});

const ids = (entries: { item: ReportItem }[]) => entries.map(e => e.item.message.id);

describe('plannerEntries', () => {
  test('a read message with a date phrase becomes an entry, with or without a resolved date', () => {
    const dated = item(at(12));
    const phraseOnly = item(null, { dateText: 'soon' });
    const entries = plannerEntries([dated, phraseOnly], []);
    expect(entries.map(e => e.at)).toEqual([at(12), null]);
  });

  test('messages without a date phrase, copies, chatter, promotions, hostile, and unread ones are left out', () => {
    const excluded: ReportItem[] = [
      item(at(12), { dateText: null }),
      item(at(12), { duplicateOf: 'm0' }),
      item(at(12), { type: 'chatter' }),
      item(at(12), { type: 'promotion' }),
      item(at(12), { instructionLike: true }),
      { ...item(at(12)), record: null },
    ];
    const failed = item(at(12));
    failed.message.status = 'failed';
    expect(plannerEntries([...excluded, failed], [])).toEqual([]);
  });

  test('an entry has a reminder only when a remind action for its message is done', () => {
    const withReminder = item(at(12));
    const blocked = item(at(13));
    const none = item(at(14));
    const entries = plannerEntries(
      [withReminder, blocked, none],
      [remind(withReminder.message.id), remind(blocked.message.id, 'blocked')],
    );
    expect(entries.map(e => e.reminder)).toEqual([true, false, false]);
  });
});

describe('groupEntries', () => {
  test('entries fall into Today, Tomorrow, This week, and Later by local day, soonest first', () => {
    const today = item(at(10, 18));
    const earlierToday = item(at(10, 9));
    const tomorrow = item(at(11, 8));
    const inTwoDays = item(at(12));
    const inSixDays = item(at(16));
    const inSevenDays = item(at(17));
    const nextMonth = item(at(5, 12, 0, 10));
    const groups = groupEntries(
      plannerEntries([nextMonth, inSevenDays, inSixDays, inTwoDays, tomorrow, today, earlierToday], []),
      NOW,
    );
    // Earlier today is still today: the day decides, not the hour.
    expect(ids(groups.today)).toEqual(ids([{ item: earlierToday }, { item: today }]));
    expect(ids(groups.tomorrow)).toEqual([tomorrow.message.id]);
    expect(ids(groups.thisWeek)).toEqual([inTwoDays.message.id, inSixDays.message.id]);
    expect(ids(groups.later)).toEqual([inSevenDays.message.id, nextMonth.message.id]);
  });

  test('a minute before midnight is today and a minute after is tomorrow, whatever the hour is now', () => {
    const beforeMidnight = item(at(10, 23, 59));
    const afterMidnight = item(at(11, 0, 1));
    for (const now of [at(10, 0, 5), at(10, 23, 58)]) {
      const groups = groupEntries(plannerEntries([beforeMidnight, afterMidnight], []), now);
      expect(ids(groups.today)).toEqual([beforeMidnight.message.id]);
      expect(ids(groups.tomorrow)).toEqual([afterMidnight.message.id]);
    }
  });

  test('the last 7 days are Passed, most recent first; anything older is dropped', () => {
    const yesterday = item(at(9, 20));
    const weekAgo = item(at(3, 8));
    const eightDaysAgo = item(at(2, 23));
    const groups = groupEntries(plannerEntries([eightDaysAgo, weekAgo, yesterday], []), NOW);
    expect(ids(groups.passed)).toEqual([yesterday.message.id, weekAgo.message.id]);
    expect(groups.today).toEqual([]);
  });

  test('entries with a phrase but no resolved date are under No exact date, newest message first', () => {
    const older = item(null, { dateText: 'soon' }, 30);
    const newer = item(null, { dateText: 'next time' }, 2);
    const groups = groupEntries(plannerEntries([older, newer], []), NOW);
    expect(ids(groups.undated)).toEqual([newer.message.id, older.message.id]);
  });

  test('with no entries every group is empty', () => {
    expect(groupEntries([], NOW)).toEqual({
      today: [],
      tomorrow: [],
      thisWeek: [],
      later: [],
      undated: [],
      passed: [],
    });
  });
});

describe('monthGrid', () => {
  const days = (grid: ReturnType<typeof monthGrid>) => grid.map(week => week.map(cell => cell?.day ?? 0));

  test('October 2026 starts on a Thursday and has 31 days in weeks of seven', () => {
    const grid = monthGrid(2026, 9, [], NOW);
    expect(grid.every(week => week.length === 7)).toBe(true);
    expect(days(grid)[0]).toEqual([0, 0, 0, 0, 1, 2, 3]);
    expect(days(grid).at(-1)).toEqual([25, 26, 27, 28, 29, 30, 31]);
  });

  test('a month starting on Sunday has no blank cells before the 1st', () => {
    // 1 November 2026 is a Sunday.
    expect(days(monthGrid(2026, 10, [], NOW))[0]).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  test('February has 28 days, and 29 in a leap year', () => {
    const count = (year: number) => monthGrid(year, 1, [], NOW).flat().filter(Boolean).length;
    expect(count(2026)).toBe(28);
    expect(count(2028)).toBe(29);
  });

  test('a day counts its entries, and only today is marked', () => {
    const entries = plannerEntries([item(at(12, 9)), item(at(12, 23, 59)), item(at(11)), item(null)], []);
    const cells = monthGrid(2026, 9, entries, NOW).flat();
    const cell = (day: number) => cells.find(c => c?.day === day)!;
    expect(cell(12).count).toBe(2);
    expect(cell(11).count).toBe(1);
    expect(cell(13).count).toBe(0);
    expect(cells.filter(c => c?.isToday).map(c => c!.day)).toEqual([10]);
    expect(cell(12).date).toBe(startOfLocalDay(at(12)));
  });

  test('an entry in another month does not count, and today is not marked there', () => {
    const cells = monthGrid(2026, 10, plannerEntries([item(at(12))], []), NOW).flat();
    expect(cells.every(c => !c || (c.count === 0 && !c.isToday))).toBe(true);
  });
});

describe('entriesOn', () => {
  test('gives that local day\'s entries, soonest first, and never undated ones', () => {
    const evening = item(at(12, 20));
    const morning = item(at(12, 8));
    const other = item(at(13));
    const undated = item(null);
    const entries = plannerEntries([evening, morning, other, undated], []);
    expect(ids(entriesOn(startOfLocalDay(at(12)), entries))).toEqual([
      morning.message.id,
      evening.message.id,
    ]);
  });
});
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `npm --prefix mobile test -- src/core/planner.test.ts`
Expected: FAIL, "Cannot find module './planner'".

- [ ] **Step 3: Write the logic**

Create `mobile/src/core/planner.ts`:

```ts
import type { ReportItem, ReportLine } from './report';
import type { Action } from './types';

/** A date MIRA found in a message. `at` is null when the phrase could not be pinned to a day. */
export interface PlannerEntry {
  item: ReportLine;
  at: number | null;
  /** True when a rule has set a reminder for this message. */
  reminder: boolean;
}

export interface Planner {
  today: PlannerEntry[];
  tomorrow: PlannerEntry[];
  thisWeek: PlannerEntry[];
  later: PlannerEntry[];
  undated: PlannerEntry[];
  passed: PlannerEntry[];
}

/** A day in a month grid. `date` is that day's local midnight. */
export interface DayCell {
  date: number;
  day: number;
  count: number;
  isToday: boolean;
}

const DAY = 24 * 60 * 60 * 1000;
/** Passed entries are kept this many days. */
const PASSED_DAYS = 7;

/** Local midnight at the start of the day holding `time`. */
export function startOfLocalDay(time: number): number {
  const date = new Date(time);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/** Whole local days from one midnight to another. Rounded, so a clock change does not shift it. */
const daysBetween = (fromMidnight: number, toMidnight: number) =>
  Math.round((toMidnight - fromMidnight) / DAY);

const soonest = (a: PlannerEntry, b: PlannerEntry) => (a.at ?? 0) - (b.at ?? 0);

/**
 * The dated messages (Inbox and Planner spec 3.1): read, with a date phrase,
 * not a copy, not chatter or a promotion, and not one that tried to give
 * instructions.
 */
export function plannerEntries(items: ReportItem[], actions: Action[]): PlannerEntry[] {
  const reminded = new Set(
    actions.filter(a => a.kind === 'remind' && a.status === 'done').map(a => a.messageId),
  );
  return items
    .filter(
      (item): item is ReportLine =>
        item.record !== null &&
        item.message.status === 'processed' &&
        item.record.dateText !== null &&
        item.record.duplicateOf === null &&
        !item.record.instructionLike &&
        item.record.type !== 'chatter' &&
        item.record.type !== 'promotion',
    )
    .map(item => ({ item, at: item.record.dateAt, reminder: reminded.has(item.message.id) }));
}

/** The Tasks view's groups, by the phone's local day. */
export function groupEntries(entries: PlannerEntry[], now: number): Planner {
  const today = startOfLocalDay(now);
  const groups: Planner = { today: [], tomorrow: [], thisWeek: [], later: [], undated: [], passed: [] };

  for (const entry of entries) {
    if (entry.at === null) {
      groups.undated.push(entry);
      continue;
    }
    const days = daysBetween(today, startOfLocalDay(entry.at));
    if (days < -PASSED_DAYS) continue;
    if (days < 0) groups.passed.push(entry);
    else if (days === 0) groups.today.push(entry);
    else if (days === 1) groups.tomorrow.push(entry);
    else if (days <= 6) groups.thisWeek.push(entry);
    else groups.later.push(entry);
  }

  groups.today.sort(soonest);
  groups.tomorrow.sort(soonest);
  groups.thisWeek.sort(soonest);
  groups.later.sort(soonest);
  groups.passed.sort((a, b) => soonest(b, a));
  groups.undated.sort((a, b) => b.item.message.postedAt - a.item.message.postedAt);
  return groups;
}

/**
 * A month as weeks of seven, Sunday first, with null outside the month.
 * `month` is 0 for January to 11 for December.
 */
export function monthGrid(
  year: number,
  month: number,
  entries: PlannerEntry[],
  now: number,
): (DayCell | null)[][] {
  const counts = new Map<number, number>();
  for (const entry of entries) {
    if (entry.at === null) continue;
    const day = startOfLocalDay(entry.at);
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }

  const today = startOfLocalDay(now);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (DayCell | null)[] = Array(new Date(year, month, 1).getDay()).fill(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day).getTime();
    cells.push({ date, day, count: counts.get(date) ?? 0, isToday: date === today });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (DayCell | null)[][] = [];
  for (let start = 0; start < cells.length; start += 7) weeks.push(cells.slice(start, start + 7));
  return weeks;
}

/** The entries on one local day (given as its midnight), soonest first. */
export function entriesOn(date: number, entries: PlannerEntry[]): PlannerEntry[] {
  return entries
    .filter(entry => entry.at !== null && startOfLocalDay(entry.at) === date)
    .sort(soonest);
}
```

- [ ] **Step 4: Run the tests to see them pass**

Run: `npm --prefix mobile test -- src/core/planner.test.ts`
Expected: PASS, 14 tests.

- [ ] **Step 5: Commit**

```bash
git add mobile/src/core/planner.ts mobile/src/core/planner.test.ts
git commit -m "feat: planner logic, dated entries, day groups, and the month grid"
```

---

### Task 4: The Tasks view

**Files:**
- Create: `mobile/src/screens/Planner/entries.tsx`
- Modify (replace contents): `mobile/src/screens/Planner/TasksView.tsx`
- Test: `mobile/__tests__/planner.test.tsx` (new)
- Modify: `mobile/__tests__/screens.test.tsx` (the `16 tasks` row)

**Interfaces:**
- Consumes: `plannerEntries`, `groupEntries`, `PlannerEntry` from Task 3; `useQuery`, `useChannels`; `Store.getItems`, `Store.getActions(before, limit)`; components `Screen`, `ReportItem`, `EmptyState`, `Tap`, `T`.
- Produces, from `mobile/src/screens/Planner/entries.tsx`:
  - `usePlannerEntries(): QueryState<PlannerEntry[]>`
  - `whenOf(entry: PlannerEntry): string`
  - `EntryRow({ entry }: { entry: PlannerEntry })`
  - `LoadState({ state, children })`, which renders the try-again line, `Loading…`, or its children
- Produces: `TasksView({ header })`, already used by `mobile/src/screens/Planner/index.tsx`.

- [ ] **Step 1: Write the failing screen tests**

Create `mobile/__tests__/planner.test.tsx`:

```tsx
import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import PlannerScreen from '../src/screens/Planner';
import { getStore } from '../src/services/db';
import { PrefsProvider } from '../src/theme/prefs';
import { testStore } from '../test-support/sqlite';

jest.mock('../src/services/db', () => ({ getStore: jest.fn() }));

const Stack = createNativeStackNavigator();
let db: Awaited<ReturnType<typeof testStore>>;
let tree: Renderer.ReactTestRenderer | undefined;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const now = new Date();
/** Noon on a day counted from today, in local time. */
const noon = (daysFromToday: number) =>
  new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysFromToday, 12, 0).getTime();

async function add(id: string, summary: string, dateAt: number | null, dateText = 'a date') {
  await db.store.addMessage(
    {
      id,
      notificationKey: id,
      packageName: 'com.facebook.orca',
      chatId: 'c1',
      sender: 'Carla',
      text: `Original ${id}`,
      postedAt: Date.now() - 60_000,
      truncated: false,
      canReply: true,
      status: 'processed',
    },
    { id: 'c1', packageName: 'com.facebook.orca', title: 'ACM Org', kind: 'group' },
  );
  await db.store.saveRecord(
    {
      messageId: id,
      type: 'deadline',
      summary,
      needsUser: true,
      urgency: 'normal',
      request: null,
      amount: null,
      dateText,
      dateAt,
      sensitive: false,
      instructionLike: false,
      duplicateOf: null,
    },
    'processed',
  );
}

beforeEach(async () => {
  db = await testStore();
  jest.mocked(getStore).mockResolvedValue(db.store);
  await db.store.saveChannel({ packageName: 'com.facebook.orca', label: 'Messenger', enabled: true, level: 2 });
});

afterEach(async () => {
  if (tree) await act(() => tree!.unmount());
  tree = undefined;
  db.close();
  jest.restoreAllMocks();
});

const settle = () =>
  act(async () => {
    for (let i = 0; i < 8; i += 1) await new Promise<void>(resolve => setTimeout(resolve, 0));
  });

async function render(view?: 'tasks' | 'calendar') {
  await act(() => {
    tree = Renderer.create(
      <SafeAreaProvider>
        <PrefsProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Planner" component={PlannerScreen} initialParams={view ? { view } : undefined} />
            </Stack.Navigator>
          </NavigationContainer>
        </PrefsProvider>
      </SafeAreaProvider>,
    );
  });
  await settle();
}

function shown(): string {
  const text = (
    node: Renderer.ReactTestRendererJSON | Renderer.ReactTestRendererJSON[] | string | null,
  ): string => {
    if (node === null) return '';
    if (typeof node === 'string') return node;
    if (Array.isArray(node)) return node.map(text).join(' ');
    return (node.children ?? []).map(text).join(' ');
  };
  return text(tree!.toJSON());
}

async function press(label: string) {
  const button = tree!.root
    .findAllByProps({ accessibilityLabel: label })
    .find(node => typeof node.props.onPress === 'function');
  expect(button).toBeDefined();
  await act(() => {
    button!.props.onPress();
  });
  await settle();
}

describe('Tasks', () => {
  test('groups what is coming up, in order, and marks a reminder', async () => {
    await add('t0', 'Due today.', noon(0));
    await add('t1', 'Due tomorrow.', noon(1));
    await add('t3', 'Due in three days.', noon(3));
    await add('t9', 'Due in nine days.', noon(9));
    await add('tu', 'Due sometime.', null, 'soon');
    await add('tp', 'Was due two days ago.', noon(-2));
    await db.store.addAction({
      id: 'a1', ruleId: 'builtin-remind', messageId: 't1', kind: 'remind', payload: {},
      status: 'done', reason: null, createdAt: Date.now(), doneAt: Date.now(),
    });
    await render();
    const text = shown();
    const order = ['Today', 'Due today.', 'Tomorrow', 'Due tomorrow.', 'This week', 'Due in three days.', 'Later', 'Due in nine days.', 'No exact date', 'Due sometime.', 'Passed', 'Was due two days ago.'];
    const positions = order.map(piece => text.indexOf(piece));
    expect(positions.every(position => position >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    expect(text).toContain('Reminder set');
    expect(text).toContain('No exact date: soon');
    expect(text).toContain('Messenger · ACM Org');
  });

  test('a group with nothing in it is not shown', async () => {
    await add('t1', 'Due tomorrow.', noon(1));
    await render();
    const text = shown();
    expect(text).toContain('Tomorrow');
    expect(text).not.toContain('This week');
    expect(text).not.toContain('Passed');
  });

  test('with no dates found it says so', async () => {
    await render();
    expect(shown()).toContain('Nothing coming up');
  });

  test('when storage cannot be read it offers to try again and does not crash', async () => {
    jest.mocked(getStore).mockRejectedValue(new Error('disk'));
    await render();
    expect(shown()).toContain('Your messages could not be loaded.');
  });
});

describe('Calendar', () => {
  test('opens on this month with today selected, and lists today\'s entries', async () => {
    await add('t0', 'Due today.', noon(0));
    await render('calendar');
    const text = shown();
    expect(text).toContain(`${MONTHS[now.getMonth()]} ${now.getFullYear()}`);
    expect(text).toContain('Due today.');
  });

  test('a day with entries says how many, and tapping it lists them', async () => {
    // The 15th and the 16th of next month, so the test does not depend on today's date.
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 15, 12, 0);
    const name = MONTHS[next.getMonth()];
    await add('n1', 'First thing on the fifteenth.', next.getTime());
    await add('n2', 'Second thing on the fifteenth.', next.getTime() + 3_600_000);
    await render('calendar');
    expect(shown()).not.toContain('First thing on the fifteenth.');

    await press('Next month');
    expect(shown()).toContain(`${name} ${next.getFullYear()}`);
    await press(`${name} 15, 2 items`);
    expect(shown()).toContain('First thing on the fifteenth.');
    expect(shown()).toContain('Second thing on the fifteenth.');

    await press(`${name} 16`);
    expect(shown()).not.toContain('First thing on the fifteenth.');
    expect(shown()).toContain('Nothing on this day.');
  });

  test('stepping back from January reaches December of the year before, and forward again', async () => {
    await render('calendar');
    const stepsToJanuary = now.getMonth();
    for (let i = 0; i < stepsToJanuary; i += 1) await press('Previous month');
    expect(shown()).toContain(`January ${now.getFullYear()}`);
    await press('Previous month');
    expect(shown()).toContain(`December ${now.getFullYear() - 1}`);
    await press('Next month');
    expect(shown()).toContain(`January ${now.getFullYear()}`);
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `npm --prefix mobile test -- __tests__/planner.test.tsx`
Expected: FAIL. Both views are empty states, so the Tasks tests that expect groups, and all the Calendar tests, fail. The Calendar tests are completed in Task 5; in this task only the `Tasks` group must pass.

- [ ] **Step 3: Write the shared pieces**

Create `mobile/src/screens/Planner/entries.tsx`:

```tsx
/** What both Planner views share: the query for dated messages, how a date reads, and a row. */
import type { ReactNode } from 'react';

import { ReportItem } from '../../components/ReportItem';
import { T } from '../../components/T';
import { Tap } from '../../components/ui';
import { plannerEntries, type PlannerEntry } from '../../core/planner';
import { type QueryState, useChannels, useQuery } from '../../services/db/hooks';

const DAY = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 30;
const MAX_ITEMS = 2000;
const MAX_ACTIONS = 1000;

/** The dates MIRA found in messages stored in the last 30 days. Re-runs after every write. */
export function usePlannerEntries(): QueryState<PlannerEntry[]> {
  return useQuery(async store => {
    const now = Date.now();
    const [items, actions] = await Promise.all([
      store.getItems(now - WINDOW_DAYS * DAY, now + DAY, MAX_ITEMS),
      store.getActions(Number.MAX_SAFE_INTEGER, MAX_ACTIONS),
    ]);
    return plannerEntries(items, actions);
  }, []);
}

/** "Mon, Oct 12 · 11:59 PM", or the phrase as written when no day could be pinned down. */
export function whenOf(entry: PlannerEntry): string {
  if (entry.at === null) return `No exact date: ${entry.item.record.dateText}`;
  const date = new Date(entry.at);
  const day = date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${day} · ${time}`;
}

/** One dated message: when, then the shared report row, which opens the message. */
export function EntryRow({ entry }: { entry: PlannerEntry }) {
  const { data: channels } = useChannels();
  const packageName = entry.item.message.packageName;
  return (
    <ReportItem
      item={entry.item}
      appLabel={channels?.find(channel => channel.packageName === packageName)?.label ?? 'Another app'}
      label={entry.reminder ? `${whenOf(entry)} · Reminder set` : whenOf(entry)}
    />
  );
}

/** The loading and failure lines both views share; shows `children` once the entries are in. */
export function LoadState({ state, children }: { state: QueryState<PlannerEntry[]>; children: ReactNode }) {
  if (state.error) {
    return (
      <Tap label="Try again" onPress={state.retry} className="rounded-16 bg-error-bg px-14 py-12">
        <T className="text-13 font-semibold text-error-ink">
          Your messages could not be loaded. Tap to try again.
        </T>
      </Tap>
    );
  }
  if (state.data === undefined) return <T className="text-14 text-ink-2">Loading…</T>;
  return <>{children}</>;
}
```

`QueryState` is exported from `mobile/src/services/db/hooks.ts`.

- [ ] **Step 4: Write the Tasks view**

Replace the contents of `mobile/src/screens/Planner/TasksView.tsx` with:

```tsx
/** Board 16-tasks-and-reminders: the dates MIRA found in messages, soonest first. */
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { EmptyState } from '../../components/EmptyBoard';
import { Screen } from '../../components/Screen';
import { T } from '../../components/T';
import { groupEntries, type Planner } from '../../core/planner';
import { EntryRow, LoadState, usePlannerEntries } from './entries';

const GROUPS: [keyof Planner, string][] = [
  ['today', 'Today'],
  ['tomorrow', 'Tomorrow'],
  ['thisWeek', 'This week'],
  ['later', 'Later'],
  ['undated', 'No exact date'],
  ['passed', 'Passed'],
];

export function TasksView({ header }: { header: ReactNode }) {
  const state = usePlannerEntries();
  const groups = groupEntries(state.data ?? [], Date.now());
  const empty = GROUPS.every(([key]) => groups[key].length === 0);

  return (
    <Screen tab="Planner">
      {header}
      <LoadState state={state}>
        {empty ? (
          <EmptyState
            title="Nothing coming up"
            body="Dates MIRA finds in your messages will appear here."
          />
        ) : (
          GROUPS.filter(([key]) => groups[key].length > 0).map(([key, title]) => (
            <View key={key} className="gap-8">
              <T accessibilityRole="header" className="text-20 font-semibold">{title}</T>
              <View>
                {groups[key].map(entry => (
                  <EntryRow key={entry.item.message.id} entry={entry} />
                ))}
              </View>
            </View>
          ))
        )}
      </LoadState>
    </Screen>
  );
}
```

- [ ] **Step 5: Update the board test and run the Tasks tests**

In `mobile/__tests__/screens.test.tsx`, change the Tasks row to:

```ts
  ['16 tasks', PlannerScreen, 'Planner'],
```

That file mocks storage so it never opens, which leaves the view at `Loading…`; the header is what it can assert.

Run: `npm --prefix mobile test -- __tests__/planner.test.tsx -t Tasks`
Expected: PASS, 4 tests (the Calendar tests are skipped by the `-t` filter).

- [ ] **Step 6: Commit**

```bash
git add mobile/src/screens/Planner/entries.tsx mobile/src/screens/Planner/TasksView.tsx mobile/__tests__/planner.test.tsx mobile/__tests__/screens.test.tsx
git commit -m "feat: Planner Tasks view groups the dates found in messages"
```

---

### Task 5: The Calendar view

**Files:**
- Modify (replace contents): `mobile/src/screens/Planner/CalendarView.tsx`
- Test: `mobile/__tests__/planner.test.tsx` (the `Calendar` group written in Task 4)
- Modify: `mobile/__tests__/screens.test.tsx` (the `17 calendar` row)

**Interfaces:**
- Consumes: `monthGrid`, `entriesOn`, `startOfLocalDay`, `DayCell` from Task 3; `usePlannerEntries`, `EntryRow`, `LoadState` from Task 4.
- Produces: `CalendarView({ header })`, already used by `mobile/src/screens/Planner/index.tsx`.

- [ ] **Step 1: Run the Calendar tests to see them fail**

Run: `npm --prefix mobile test -- __tests__/planner.test.tsx -t Calendar`
Expected: FAIL, 3 tests. The view is still the "No events" empty state: no month title, no "Next month" button.

- [ ] **Step 2: Write the Calendar view**

Replace the contents of `mobile/src/screens/Planner/CalendarView.tsx` with:

```tsx
/** Board 17-calendar: a month of the dates MIRA found, with the chosen day's entries below. */
import { type ReactNode, useState } from 'react';
import { View } from 'react-native';

import { Screen } from '../../components/Screen';
import { T } from '../../components/T';
import { Tap } from '../../components/ui';
import { entriesOn, monthGrid, startOfLocalDay } from '../../core/planner';
import { EntryRow, LoadState, usePlannerEntries } from './entries';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function CalendarView({ header }: { header: ReactNode }) {
  const state = usePlannerEntries();
  const entries = state.data ?? [];
  const now = Date.now();
  const today = new Date(now);
  const [shownMonth, setShownMonth] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selected, setSelected] = useState(startOfLocalDay(now));

  /** `new Date` rolls the month over, so stepping past December or before January just works. */
  const step = (by: number) => {
    const next = new Date(shownMonth.year, shownMonth.month + by, 1);
    setShownMonth({ year: next.getFullYear(), month: next.getMonth() });
  };

  const monthName = MONTHS[shownMonth.month];
  const weeks = monthGrid(shownMonth.year, shownMonth.month, entries, now);
  const onDay = entriesOn(selected, entries);

  return (
    <Screen tab="Planner">
      {header}
      <LoadState state={state}>
        <View className="gap-10 rounded-22 border border-white/80 bg-white/46 p-16">
          <View className="flex-row items-center justify-between">
            <Tap label="Previous month" onPress={() => step(-1)} className="h-48 w-48 items-center justify-center">
              <T className="text-20 font-bold text-navy">‹</T>
            </Tap>
            <T accessibilityRole="header" className="text-18 font-bold">
              {`${monthName} ${shownMonth.year}`}
            </T>
            <Tap label="Next month" onPress={() => step(1)} className="h-48 w-48 items-center justify-center">
              <T className="text-20 font-bold text-navy">›</T>
            </Tap>
          </View>
          <View className="flex-row">
            {WEEKDAYS.map((letter, index) => (
              <T key={index} className="flex-1 text-center text-12 font-bold text-ink-label">{letter}</T>
            ))}
          </View>
          {weeks.map((week, row) => (
            <View key={row} className="flex-row">
              {week.map((cell, column) =>
                cell === null ? (
                  <View key={column} className="h-48 flex-1" />
                ) : (
                  <Tap
                    key={column}
                    label={`${monthName} ${cell.day}${
                      cell.count ? `, ${cell.count} ${cell.count === 1 ? 'item' : 'items'}` : ''
                    }`}
                    accessibilityState={{ selected: cell.date === selected }}
                    onPress={() => setSelected(cell.date)}
                    className={`h-48 flex-1 items-center justify-center rounded-14 ${
                      cell.date === selected ? 'bg-navy' : cell.isToday ? 'bg-peri-tonal' : ''
                    }`}
                  >
                    <T className={`text-14 font-semibold ${cell.date === selected ? 'text-white' : 'text-ink'}`}>
                      {cell.day}
                    </T>
                    <View
                      className={`h-6 w-6 rounded-full ${
                        cell.count === 0 ? '' : cell.date === selected ? 'bg-white' : 'bg-navy'
                      }`}
                    />
                  </Tap>
                ),
              )}
            </View>
          ))}
        </View>

        <View className="gap-8">
          <T accessibilityRole="header" className="text-20 font-semibold">
            {new Date(selected).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </T>
          {onDay.length === 0 ? (
            <T className="text-14 text-ink-2">Nothing on this day.</T>
          ) : (
            <View>
              {onDay.map(entry => (
                <EntryRow key={entry.item.message.id} entry={entry} />
              ))}
            </View>
          )}
        </View>
      </LoadState>
    </Screen>
  );
}
```

- [ ] **Step 3: Update the board test and run everything for the Planner**

In `mobile/__tests__/screens.test.tsx`, change the Calendar row to:

```ts
  ['17 calendar', PlannerScreen, 'Planner', { view: 'calendar' }],
```

Run: `npm --prefix mobile test -- __tests__/planner.test.tsx __tests__/screens.test.tsx`
Expected: PASS.

- [ ] **Step 4: Run the whole suite and type-check**

Run: `npm --prefix mobile test`
Expected: PASS, every suite.
Run: `cd mobile && npx tsc --noEmit`
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add mobile/src/screens/Planner/CalendarView.tsx mobile/__tests__/screens.test.tsx
git commit -m "feat: Planner Calendar view, a month of dated messages with the day's entries"
```

---

### Task 6: The phone check and the records

**Files:**
- Modify: `docs/PLAN.md`

**Interfaces:**
- Consumes: everything above, built into a release APK.
- Produces: the phone result recorded in `docs/PLAN.md`.

- [ ] **Step 1: Build and install the release app**

```bash
cd mobile/android && ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a
adb install -r app/build/outputs/apk/release/app-release.apk
```

Expected: `BUILD SUCCESSFUL`, then `Success`. `-r` keeps the app's data and the model file.

- [ ] **Step 2: Check on the phone**

Before tapping anything through `adb`, confirm MIRA is the app in front (`adb shell dumpsys window | grep mCurrentFocus` shows `com.mira.app`); if it is not, stop and ask.

| Where | Expect |
| :--- | :--- |
| Inbox tab | The stored messages, newest first, each with a label line and "Messenger · chat" |
| Inbox, "With a date" | The October 11 and October 12 deadline messages |
| Inbox, "Ignored" | The short chatter messages |
| Planner, Tasks | The two deadlines under the group matching today's date, or under "Passed" if their days have gone |
| Planner, Calendar | Dots on October 11 and 12; tapping one lists its message |
| Any row | Opens the message detail |

- [ ] **Step 3: Record the result**

In `docs/PLAN.md`, add under **Task 2.5** (or the nearest Planner or Inbox entry) a dated note saying the Inbox and Planner tabs are built per `docs/specs/2026-10-10-inbox-planner-design.md`, with what the phone check showed, and that the calendar is MIRA's own: nothing is written to the phone's calendar.

- [ ] **Step 4: Commit**

```bash
git add docs/PLAN.md
git commit -m "docs: Inbox and Planner built and checked on the phone"
```

Merging to `main` and pushing is the user's decision; ask before doing either.
