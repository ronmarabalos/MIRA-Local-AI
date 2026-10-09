import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PrefsProvider } from '../src/theme/prefs';
import { testStore } from '../test-support/sqlite';
import { getStore } from '../src/services/db';
import { bridge } from '../src/services';
import { getActionRunner } from '../src/services/actions/runner';
import { createActionRunner } from '../src/services/actions';
import { createFakeModel } from '../src/services/fakes/model';
import { BUILTIN_RULES } from '../src/core/builtinRules';
import ConnectedApps from '../src/screens/ConnectedApps';
import Automations from '../src/screens/Automations';
import Approvals from '../src/screens/Approvals';
import Activity from '../src/screens/Activity';
import Settings from '../src/screens/Settings';

jest.mock('../src/services/db', () => ({ getStore: jest.fn() }));
jest.mock('../src/services/channels/manager', () => ({
  getChannelManager: async () => {
    const { createChannelManager } = require('../src/services/channels');
    const { getStore: open } = require('../src/services/db');
    const { bridge: native } = require('../src/services');
    return createChannelManager(await open(), native);
  },
}));
jest.mock('../src/services/actions/runner', () => ({
  getActionRunner: jest.fn(),
}));
const Stack = createNativeStackNavigator();
let db: Awaited<ReturnType<typeof testStore>>;
let tree: Renderer.ReactTestRenderer | undefined;
const now = Date.now();
beforeEach(async () => {
  db = await testStore();
  jest.mocked(getStore).mockResolvedValue(db.store);
  await db.store.saveChannel({
    packageName: 'com.facebook.orca',
    label: 'Messenger',
    enabled: true,
    level: 2,
  });
  await db.store.addMessage(
    {
      id: 'm1',
      notificationKey: 'n1',
      packageName: 'com.facebook.orca',
      chatId: 'c1',
      sender: 'Test sender',
      text: 'Can you send the report tomorrow?',
      postedAt: now,
      truncated: false,
      canReply: true,
      status: 'processed',
    },
    {
      id: 'c1',
      packageName: 'com.facebook.orca',
      title: 'Test chat',
      kind: 'private',
    },
  );
  await db.store.saveRecord(
    {
      messageId: 'm1',
      type: 'question',
      summary: 'Report requested',
      needsUser: true,
      urgency: 'normal',
      request: null,
      dateText: 'tomorrow',
      dateAt: now + 86400000,
      amount: null,
      sensitive: false,
      instructionLike: false,
      duplicateOf: null,
    },
    'processed',
  );
  for (const rule of BUILTIN_RULES) await db.store.saveRule(rule);
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
async function render(Screen: React.ComponentType) {
  await act(async () => {
    tree = Renderer.create(
      <SafeAreaProvider>
        <PrefsProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Test" component={Screen} />
            </Stack.Navigator>
          </NavigationContainer>
        </PrefsProvider>
      </SafeAreaProvider>,
    );
  });
}
function output(): string {
  const text = (
    n:
      | Renderer.ReactTestRendererJSON
      | Renderer.ReactTestRendererJSON[]
      | string
      | null,
  ): string =>
    n === null
      ? ''
      : typeof n === 'string'
      ? n
      : Array.isArray(n)
      ? n.map(text).join(' ')
      : (n.children ?? []).map(text).join(' ');
  return text(tree!.toJSON());
}
async function press(label: string) {
  const control = tree!.root.findAll(
    n =>
      n.props.accessibilityLabel === label &&
      typeof n.props.onPress === 'function',
  )[0];
  expect(control).toBeDefined();
  await act(async () => control.props.onPress());
}
async function draft() {
  await db.store.addDraft({
    id: 'd1',
    messageId: 'm1',
    text: 'I will send it tomorrow.',
    firstText: 'I will send it tomorrow.',
    status: 'waiting',
  });
}

test('Connected Apps reads saved values and persists off and level choices', async () => {
  const sync = jest.spyOn(bridge, 'setEnabledPackages');
  await render(ConnectedApps);
  await press('Read Messenger');
  expect((await db.store.getChannels())[0].enabled).toBe(false);
  expect(sync).toHaveBeenLastCalledWith([]);
  await press('Read Messenger');
  await press('Read and report for Messenger');
  expect((await db.store.getChannels())[0].level).toBe(1);
});
test('Connected Apps exposes a failed save and retry without a false success', async () => {
  jest
    .spyOn(bridge, 'setEnabledPackages')
    .mockRejectedValueOnce(new Error('native failure'));
  await render(ConnectedApps);
  await press('Read Messenger');
  expect(output()).toContain('Could not save');
  expect((await db.store.getChannels())[0].enabled).toBe(true);
  await press('Retry change');
  expect((await db.store.getChannels())[0].enabled).toBe(false);
});
test('rules show real preview counts and switching on persists', async () => {
  await render(Automations);
  expect(output()).toContain('1 stored message');
  await press(
    'Enable Draft replies to questions in private chats, for me to approve.',
  );
  expect(
    (await db.store.getRules()).find(r => r.id === 'builtin-draft')?.enabled,
  ).toBe(true);
});
test('Activity shows blocked reason, rule, and exact original', async () => {
  await db.store.addAction({
    id: 'a1',
    ruleId: 'builtin-draft',
    messageId: 'm1',
    kind: 'draft',
    payload: {},
    status: 'blocked',
    reason: 'The message tries to give instructions, so nothing was done.',
    createdAt: now,
    doneAt: null,
  });
  await render(Activity);
  expect(output()).toContain('nothing was done');
  expect(output()).toContain('Can you send the report tomorrow?');
  expect(output()).toContain('Draft replies to questions');
});
test('Send opens confirmation; cancel never sends; edited text is saved before confirmed send', async () => {
  await draft();
  const send = jest.spyOn(bridge, 'sendReply').mockResolvedValue('sent');
  await render(Approvals);
  const input = tree!.root.findAll(
    n => n.props.accessibilityLabel === 'Reply text d1' && n.props.onChangeText,
  )[0];
  await act(() => input.props.onChangeText('Edited reply'));
  await press('Send reply d1');
  expect(send).not.toHaveBeenCalled();
  await press('Cancel send');
  expect(send).not.toHaveBeenCalled();
  await press('Send reply d1');
  await press('Confirm send');
  expect(send).toHaveBeenCalledWith('n1', 'Edited reply');
  expect((await db.store.getDrafts('sent'))[0].firstText).toBe(
    'I will send it tomorrow.',
  );
});
test('discard removes pending draft without sending', async () => {
  await draft();
  const send = jest.spyOn(bridge, 'sendReply');
  await render(Approvals);
  await press('Discard draft d1');
  expect(await db.store.getDrafts('waiting')).toEqual([]);
  expect(send).not.toHaveBeenCalled();
});
test('offline confirmation shows Queued and does not send', async () => {
  await draft();
  jest.spyOn(bridge, 'isOnline').mockResolvedValue(false);
  const send = jest.spyOn(bridge, 'sendReply');
  await render(Approvals);
  await press('Send reply d1');
  await press('Confirm send');
  expect(output()).toContain('Queued');
  expect(send).not.toHaveBeenCalled();
});
test('Privacy proof reads real facts and processed count', async () => {
  jest
    .spyOn(bridge, 'getProofFacts')
    .mockResolvedValue({
      hasInternetPermission: true,
      bytesSent: 123,
      isDebugBuild: true,
    });
  await render(Settings);
  expect(output()).toContain('Development build: internet permission present.');
  expect(output()).toContain('123 bytes');
  expect(output()).toContain('1 message processed today');
});
