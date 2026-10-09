import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AssistantScreen from '../src/screens/Assistant';
import { model } from '../src/services';
import { getStore } from '../src/services/db';
import { PrefsProvider } from '../src/theme/prefs';
import { testStore } from '../test-support/sqlite';

jest.mock('../src/services/db', () => ({ getStore: jest.fn() }));

const Stack = createNativeStackNavigator();
let db: Awaited<ReturnType<typeof testStore>>;
let tree: Renderer.ReactTestRenderer | undefined;

beforeEach(async () => {
  db = await testStore();
  jest.mocked(getStore).mockResolvedValue(db.store);
  const now = Date.now();
  const add = async (
    id: string,
    sender: string,
    text: string,
    dateText: string | null,
  ) => {
    await db.store.addMessage(
      {
        id,
        notificationKey: id,
        packageName: 'com.facebook.orca',
        chatId: 'c1',
        sender,
        text,
        postedAt: now - 60_000,
        truncated: false,
        canReply: true,
        status: 'processed',
      },
      {
        id: 'c1',
        packageName: 'com.facebook.orca',
        title: 'ACM Org',
        kind: 'group',
      },
    );
    await db.store.saveRecord(
      {
        messageId: id,
        type: 'payment',
        summary: `${sender} about ${text.slice(0, 20)}`,
        needsUser: true,
        urgency: 'normal',
        request: null,
        amount: null,
        dateText,
        dateAt: null,
        sensitive: false,
        instructionLike: false,
        duplicateOf: null,
      },
      'processed',
    );
  };
  await add(
    'm1',
    'Carla',
    'Org fee of 150 pesos is due this Friday.',
    'this Friday',
  );
  await add(
    'm2',
    'Prof. Reyes',
    'The proposal is due on Monday morning.',
    'Monday morning',
  );
});

afterEach(async () => {
  if (tree) await act(() => tree!.unmount());
  tree = undefined;
  db.close();
  jest.restoreAllMocks();
});

async function render() {
  await act(() => {
    tree = Renderer.create(
      <SafeAreaProvider>
        <PrefsProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Assistant" component={AssistantScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </PrefsProvider>
      </SafeAreaProvider>,
    );
  });
}

const settle = () =>
  act(async () => {
    for (let i = 0; i < 6; i += 1)
      await new Promise<void>(resolve => setTimeout(resolve, 0));
  });

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

const field = () =>
  tree!.root.findAllByProps({ accessibilityLabel: 'Your question' })[0];
const askButton = () =>
  tree!.root.findAllByProps({ accessibilityLabel: 'Ask' })[0];

async function ask(question: string) {
  await act(() => field().props.onChangeText(question));
  // Not returned: act would wait for the whole answer before the next question could be sent.
  await act(() => {
    askButton().props.onPress();
  });
}

test('starts with example questions, and Ask is disabled until something is typed', async () => {
  await render();
  expect(shown()).toContain('When is the next deadline?');
  expect(askButton().props.disabled).toBe(true);
  await act(() => field().props.onChangeText('org fee'));
  expect(askButton().props.disabled).toBe(false);
  expect(field().props.maxLength).toBe(300);
});

test("a question shows its source, the stored fact, and then MIRA's answer", async () => {
  await render();
  await ask('when is the org fee due?');
  await settle();
  const text = shown();
  expect(text).toContain('when is the org fee due?');
  expect(text).toContain('Org fee of 150 pesos is due this Friday.');
  expect(text).toContain('Date: this Friday');
  expect(text).toContain('MIRA’s answer');
  expect(text).toContain('Carla wrote:');
});

test('a question with no match says so and does not ask the model', async () => {
  const answer = jest.spyOn(model, 'answer');
  await render();
  await ask('what about the basketball tryouts?');
  await settle();
  expect(shown()).toContain('I couldn’t find that in your messages.');
  expect(answer).not.toHaveBeenCalled();
});

test('when the model has no answer, the sources stay under "Here\'s what I found"', async () => {
  jest.spyOn(model, 'answer').mockRejectedValue(new Error('no answer'));
  await render();
  await ask('org fee');
  await settle();
  const text = shown();
  expect(text).toContain('Here’s what I found');
  expect(text).toContain('Org fee of 150 pesos is due this Friday.');
  expect(text).not.toContain('MIRA’s answer');
});

test('two questions sent quickly each get their own answer', async () => {
  const releases: Record<string, (value: string) => void> = {};
  jest.spyOn(model, 'answer').mockImplementation(
    question =>
      new Promise<string>(resolve => {
        releases[question] = resolve;
      }),
  );
  await render();
  await ask('org fee');
  await ask('proposal');
  await settle();
  // The second question's answer arrives first.
  await act(async () => releases.proposal('ANSWER-ABOUT-PROPOSAL'));
  await act(async () => releases['org fee']('ANSWER-ABOUT-FEE'));
  await settle();
  const text = shown();
  const proposalAt = text.indexOf('ANSWER-ABOUT-PROPOSAL');
  const feeAt = text.indexOf('ANSWER-ABOUT-FEE');
  expect(proposalAt).toBeGreaterThan(-1);
  expect(feeAt).toBeGreaterThan(-1);
  // Newest question first: "proposal" block, then "org fee" block, each holding its own answer.
  expect(text.indexOf('The proposal is due on Monday morning.')).toBeLessThan(
    feeAt,
  );
  expect(proposalAt).toBeLessThan(feeAt);
});
