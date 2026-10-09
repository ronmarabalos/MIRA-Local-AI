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
  opts: {
    packageName?: string;
    minutesAgo?: number;
    status?: 'processed' | 'filtered';
  } = {},
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
  await db.store.saveChannel({
    packageName: 'com.facebook.orca',
    label: 'Messenger',
    enabled: true,
    level: 2,
  });
  await db.store.saveChannel({
    packageName: 'com.google.android.gm',
    label: 'Gmail',
    enabled: true,
    level: 1,
  });
});

afterEach(async () => {
  if (tree) await act(() => tree!.unmount());
  tree = undefined;
  db.close();
  jest.restoreAllMocks();
});

const settle = () =>
  act(async () => {
    for (let i = 0; i < 8; i += 1)
      await new Promise<void>(resolve => setTimeout(resolve, 0));
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
    node:
      | Renderer.ReactTestRendererJSON
      | Renderer.ReactTestRendererJSON[]
      | string
      | null,
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
  await add('m1', 'Project is due on October 12.', {
    type: 'deadline',
    needsUser: true,
    dateText: 'oct 12',
  });
  await add(
    'm2',
    'Just saying hi.',
    { type: 'chatter' },
    { status: 'filtered', minutesAgo: 5 },
  );
  await render();
  const text = shown();
  expect(text).toContain('Project is due on October 12.');
  expect(text).toContain('Deadline · Needs you · oct 12 ·');
  expect(text).toContain('Ignored · Chatter ·');
  expect(text).toContain('Messenger · ACM Org');
  expect(text).not.toContain('com.facebook.orca');
});

test('a filter narrows the list, and one with nothing in it says so', async () => {
  await add('m1', 'Project is due on October 12.', {
    type: 'deadline',
    needsUser: true,
    dateText: 'oct 12',
  });
  await add(
    'm2',
    'Just saying hi.',
    { type: 'chatter' },
    { status: 'filtered' },
  );
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
  expect(
    tree!.root.findAllByProps({ accessibilityLabel: 'All apps' }),
  ).toHaveLength(0);
  await act(() => tree!.unmount());

  await add(
    'm2',
    'From the mail.',
    {},
    { packageName: 'com.google.android.gm' },
  );
  await render();
  await press('Gmail');
  expect(shown()).toContain('From the mail.');
  expect(shown()).not.toContain('From the chat.');
});

test('shows 50 rows until Show more is pressed, and a filter change goes back to 50', async () => {
  for (let i = 1; i <= 55; i += 1) {
    await add(
      `m${i}`,
      `Summary number ${String(i).padStart(2, '0')}.`,
      { needsUser: true },
      { minutesAgo: i },
    );
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
  expect(
    tree!.root.findAllByProps({ accessibilityLabel: 'Try again' }).length,
  ).toBeGreaterThan(0);
});
