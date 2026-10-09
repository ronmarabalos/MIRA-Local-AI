import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import EmailDetailScreen from '../src/screens/EmailDetail';
import { bridge } from '../src/services';
import { createActionRunner } from '../src/services/actions';
import { getActionRunner } from '../src/services/actions/runner';
import { getStore } from '../src/services/db';
import { createFakeModel } from '../src/services/fakes/model';
import { PrefsProvider } from '../src/theme/prefs';
import { testStore } from '../test-support/sqlite';

jest.mock('../src/services/db', () => ({ getStore: jest.fn() }));
jest.mock('../src/services/actions/runner', () => ({
  getActionRunner: jest.fn(),
}));

const Stack = createNativeStackNavigator();
let db: Awaited<ReturnType<typeof testStore>>;
let tree: Renderer.ReactTestRenderer | undefined;

async function seed(options: { level?: 1 | 2; canReply?: boolean } = {}) {
  await db.store.saveChannel({
    packageName: 'com.facebook.orca',
    label: 'Messenger',
    enabled: true,
    level: options.level ?? 2,
  });
  await db.store.addMessage(
    {
      id: 'm1',
      notificationKey: 'n1',
      packageName: 'com.facebook.orca',
      chatId: 'c1',
      sender: 'Maya',
      text: 'Can we move our group meeting to tomorrow at 3 PM?',
      postedAt: Date.now() - 60_000,
      truncated: false,
      canReply: options.canReply ?? true,
      status: 'processed',
    },
    {
      id: 'c1',
      packageName: 'com.facebook.orca',
      title: 'Study group',
      kind: 'group',
    },
  );
  await db.store.saveRecord(
    {
      messageId: 'm1',
      type: 'request',
      summary: 'Maya asks to move the meeting.',
      needsUser: true,
      urgency: 'normal',
      request: null,
      amount: null,
      dateText: null,
      dateAt: null,
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
  jest
    .mocked(getActionRunner)
    .mockResolvedValue(
      createActionRunner({ store: db.store, bridge, model: createFakeModel() }),
    );
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
              <Stack.Screen
                name="EmailDetail"
                component={EmailDetailScreen}
                initialParams={{ messageId: 'm1' }}
              />
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

const buttons = (label: string) =>
  tree!.root.findAllByProps({ accessibilityLabel: label });

async function press(label: string) {
  await act(() => {
    buttons(label)[0].props.onPress();
  });
  await settle();
}

test('asking for a draft writes one that waits in Approvals, even for a group chat', async () => {
  await seed();
  await render();
  expect(buttons('Draft a reply').length).toBeGreaterThan(0);

  await press('Draft a reply');

  const drafts = await db.store.getDrafts('waiting');
  expect(drafts).toHaveLength(1);
  expect(drafts[0].messageId).toBe('m1');
  expect(shown()).toContain('Draft ready');
  expect(buttons('Review draft').length).toBeGreaterThan(0);
  expect(buttons('Draft a reply')).toHaveLength(0);
});

test('a message that already has a waiting draft offers the review, not a second draft', async () => {
  await seed();
  await db.store.addDraft({
    id: 'd1',
    messageId: 'm1',
    text: 'Sure.',
    firstText: 'Sure.',
    status: 'waiting',
  });
  await render();
  expect(buttons('Review draft').length).toBeGreaterThan(0);
  expect(buttons('Draft a reply')).toHaveLength(0);
});

test('when replies are off for the app, it says how to turn them on and writes nothing', async () => {
  await seed({ level: 1 });
  await render();
  await press('Draft a reply');
  expect(shown()).toContain('Connected Apps');
  expect(await db.store.getDrafts('waiting')).toHaveLength(0);
});

test('a message that cannot be answered has no draft button and says why', async () => {
  await seed({ canReply: false });
  await render();
  expect(buttons('Draft a reply')).toHaveLength(0);
  expect(shown()).toContain('This message can’t be answered from MIRA.');
});
