import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BUILTIN_RULES } from '../src/core/builtinRules';
import ReplyHelperScreen from '../src/screens/ReplyHelper';
import { bridge, model } from '../src/services';
import { createActionRunner } from '../src/services/actions';
import { getActionRunner } from '../src/services/actions/runner';
import { getStore } from '../src/services/db';
import { PrefsProvider } from '../src/theme/prefs';
import { testStore } from '../test-support/sqlite';

jest.mock('../src/services/db', () => ({ getStore: jest.fn() }));
jest.mock('../src/services/actions/runner', () => ({ getActionRunner: jest.fn() }));
jest.mock('../src/services/channels/manager', () => ({
  getChannelManager: async () => {
    const { createChannelManager } = require('../src/services/channels');
    const { getStore: open } = require('../src/services/db');
    const { bridge: native } = require('../src/services');
    return createChannelManager(await open(), native);
  },
}));

const Stack = createNativeStackNavigator();
let db: Awaited<ReturnType<typeof testStore>>;
let tree: Renderer.ReactTestRenderer | undefined;

beforeEach(async () => {
  db = await testStore();
  jest.mocked(getStore).mockResolvedValue(db.store);
  for (const rule of BUILTIN_RULES) await db.store.saveRule(rule);
  jest.mocked(getActionRunner).mockResolvedValue(createActionRunner({ bridge, model, store: db.store }));
  await db.store.saveChannel({ packageName: 'com.facebook.orca', label: 'Messenger', enabled: true, level: 1 });
  const now = Date.now();
  await db.store.addMessage(
    {
      id: 'q1',
      notificationKey: 'k1',
      packageName: 'com.facebook.orca',
      chatId: 'ana',
      sender: 'Ana',
      text: 'Can you lend me your notes?',
      postedAt: now - 60_000,
      truncated: false,
      canReply: true,
      status: 'new',
    },
    { id: 'ana', packageName: 'com.facebook.orca', title: 'Ana', kind: 'private' },
  );
  await db.store.saveRecord(
    {
      messageId: 'q1',
      type: 'question',
      summary: 'Ana asks to borrow your notes.',
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
});

afterEach(async () => {
  if (tree) await act(async () => tree!.unmount());
  tree = undefined;
  db.close();
});

async function render() {
  await act(async () => {
    tree = Renderer.create(
      <SafeAreaProvider>
        <PrefsProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="ReplyHelper" component={ReplyHelperScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </PrefsProvider>
      </SafeAreaProvider>,
    );
  });
}

const shown = () => JSON.stringify(tree!.toJSON());
const find = (label: string) =>
  tree!.root.findAll(n => n.props.accessibilityLabel === label && (n.props.onPress || n.props.onChangeText))[0];
const press = (label: string) => act(async () => find(label).props.onPress());

test('MIRA asks step by step, turns on drafts, and writes a reply to today’s question', async () => {
  const draft = jest.spyOn(model, 'draftReply');
  await render();
  expect(shown()).toContain('I can write replies to your messages.');

  await press('Let’s set it up');
  expect(shown()).toContain('tell me a little about you');
  await act(async () => find('About you').props.onChangeText('Nursing student'));
  await press('Next');

  expect(shown()).toContain('Which apps should I write replies in?');
  await press('Next');
  expect(shown()).toContain('Which messages should I write replies to?');
  await press('Requests and favours');
  await press('Next');
  expect(shown()).toContain('How should I sound?');
  await press('Friendly');
  expect(shown()).toContain('You check each one before it’s sent.');

  await press('Turn on reply drafts');
  const rule = (await db.store.getRules()).find(r => r.id === 'builtin-draft')!;
  expect(rule.enabled).toBe(true);
  expect(rule.definition.if.types).toEqual(['question', 'request']);
  expect((await db.store.getChannels())[0].level).toBe(2);
  expect(await db.store.getPrefs()).toMatchObject({ replyAbout: 'Nursing student', replyTone: 'Friendly' });

  await press('Yes, write them now');
  expect(shown()).toContain('I wrote 1 reply.');
  expect(await db.store.getDrafts('waiting')).toHaveLength(1);
  // The draft is written in the voice the user gave.
  expect(draft.mock.calls[0][1].voice).toEqual({ about: 'Nursing student', tone: 'Friendly' });
  // Nothing is sent from here.
  expect(find('Review drafts')).toBeDefined();
});

test('when drafts are already on, it offers to review them or change the answers', async () => {
  await db.store.setRuleEnabled('builtin-draft', true);
  await render();
  expect(shown()).toContain('Reply drafts are on');
  expect(find('Change my answers')).toBeDefined();
});
