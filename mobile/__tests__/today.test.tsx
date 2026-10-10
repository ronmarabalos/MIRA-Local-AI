import React from 'react';
import { Text } from 'react-native';
import Renderer, { act } from 'react-test-renderer';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { getStore } from '../src/services/db';
import { createStore } from '../src/services/db/store';
import {
  migrate,
  type Row,
  type Scalar,
  type SqlDatabase,
} from '../src/services/db/schema';
import { useQuery } from '../src/services/db/hooks';
import type { Chat, Message, MiraRecord } from '../src/core/types';
import HomeScreen from '../src/screens/Home';
import EmailDetailScreen from '../src/screens/EmailDetail';
import AssistantScreen from '../src/screens/Assistant';
import { BUILTIN_RULES } from '../src/core/builtinRules';
import { PrefsProvider } from '../src/theme/prefs';

jest.mock('../src/services/db', () => ({ getStore: jest.fn() }));

const Stack = createNativeStackNavigator();
const mockGetStore = jest.mocked(getStore);
let store: ReturnType<typeof createStore>;
let closeDb: () => void;
let tree: Renderer.ReactTestRenderer | undefined;
const today = new Date().setHours(12, 0, 0, 0);
const chat: Chat = {
  id: 'class',
  packageName: 'com.facebook.orca',
  title: 'Class notices',
  kind: 'group',
};

function message(id: string, status: Message['status'] = 'processed'): Message {
  return {
    id,
    notificationKey: id,
    packageName: chat.packageName,
    chatId: chat.id,
    sender: 'Ana Santos',
    text: `Original ${id}: pay PHP 450 by Friday.`,
    postedAt: today,
    truncated: false,
    canReply: false,
    status,
  };
}

function record(id: string): MiraRecord {
  return {
    messageId: id,
    type: 'payment',
    summary: `Fee notice ${id}`,
    needsUser: true,
    urgency: 'high',
    request: 'Pay fee',
    amount: 'PHP 450',
    dateText: 'Friday',
    dateAt: today,
    sensitive: false,
    instructionLike: false,
    duplicateOf: null,
  };
}

async function seed(
  id: string,
  status: Message['status'] = 'processed',
  patch: Partial<MiraRecord> = {},
) {
  await store.addMessage(message(id, status), chat);
  if (status !== 'new')
    await store.saveRecord({ ...record(id), ...patch }, status);
}

beforeEach(async () => {
  const { DatabaseSync } = require('node:sqlite');
  const raw = new DatabaseSync(':memory:');
  closeDb = () => raw.close();
  const execute = async (sql: string, params: Scalar[] = []) => {
    const statement = raw.prepare(sql);
    return statement.columns().length
      ? { rows: statement.all(...params) as Row[], rowsAffected: 0 }
      : { rows: [], rowsAffected: Number(statement.run(...params).changes) };
  };
  const db: SqlDatabase = {
    execute,
    async transaction(fn) {
      raw.exec('BEGIN');
      try {
        await fn({ execute });
        raw.exec('COMMIT');
      } catch (error) {
        raw.exec('ROLLBACK');
        throw error;
      }
    },
  };
  await migrate(db);
  store = createStore(db);
  mockGetStore.mockReset().mockResolvedValue(store);
  await store.saveChannel({
    packageName: chat.packageName,
    label: 'Messenger',
    enabled: true,
    level: 1,
  });
});

afterEach(async () => {
  if (tree) await act(() => tree!.unmount());
  tree = undefined;
  closeDb();
});

async function render(detailId?: string, initial = 'Home') {
  await act(async () => {
    tree = Renderer.create(
      <SafeAreaProvider>
        <PrefsProvider>
          <NavigationContainer>
            <Stack.Navigator
              initialRouteName={initial}
              screenOptions={{ headerShown: false, animation: 'none' }}
            >
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="Assistant" component={AssistantScreen} />
              <Stack.Screen
                name="EmailDetail"
                component={EmailDetailScreen}
                initialParams={detailId ? { messageId: detailId } : undefined}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </PrefsProvider>
      </SafeAreaProvider>,
    );
  });
}

const output = () => {
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
};
async function press(label: string) {
  const button = tree!.root
    .findAllByProps({ accessibilityLabel: label })
    .find(node => typeof node.props.onPress === 'function');
  expect(button).toBeDefined();
  await act(async () => button!.props.onPress());
}

test('Home displays stored reports with sources and opens the exact message, then goes back', async () => {
  await seed('tuition');
  await render();
  expect(output()).toContain('Fee notice tuition');
  expect(output()).toContain('Original tuition: pay PHP 450 by Friday.');
  expect(output()).toContain('Messenger');
  expect(output()).toContain('Class notices');
  expect(output()).not.toContain('Maya Chen');
  await press('Open message from Ana Santos: Fee notice tuition');
  expect(output()).toContain('Original message');
  expect(output()).toContain('Original tuition: pay PHP 450 by Friday.');
  await press('Back to report');
  expect(output()).toContain('Needs you');
});

test('mounted report refreshes when intake stores a message', async () => {
  await render();
  expect(output()).toContain('No messages today');
  await act(async () => seed('new-arrival'));
  expect(output()).toContain('Fee notice new-arrival');
  expect(output()).not.toContain('No messages today');
});

test('empty report offers app selection and makes stored offline availability clear', async () => {
  await render();
  expect(output()).toContain('No messages today');
  expect(output()).toContain('Choose apps');
  expect(output()).not.toContain('Reply to Sam');
});

test('loading shows placeholders instead of sample content', async () => {
  mockGetStore.mockReturnValue(new Promise(() => {}));
  await render();
  expect(output()).toContain('Loading saved messages');
  expect(output()).not.toContain('Maya Chen');
});

test('failed reads show recovery and Retry loads the report', async () => {
  await seed('retry');
  mockGetStore.mockRejectedValueOnce(new Error('private database diagnostic'));
  await render();
  expect(output()).toContain('Could not load saved messages');
  expect(output()).not.toContain('private database diagnostic');
  await press('Retry');
  expect(output()).toContain('Fee notice retry');
});

test('pending and failed extraction remain visible without presenting invented summaries', async () => {
  await seed('waiting', 'new');
  await seed('failed', 'failed');
  await render();
  expect(output()).toContain('Reading messages');
  expect(output()).toContain("Couldn't read");
  expect(output()).toContain('Original failed: pay PHP 450 by Friday.');
  expect(output()).not.toContain('Fee notice failed');
});

test('queued action keeps its status and source even for a message from yesterday', async () => {
  await store.addMessage(
    { ...message('yesterday'), postedAt: today - 86400000 },
    chat,
  );
  await store.saveRecord(record('yesterday'), 'processed');
  await store.addAction({
    id: 'queued',
    ruleId: null,
    messageId: 'yesterday',
    kind: 'send',
    payload: {},
    status: 'queued',
    reason: null,
    createdAt: today,
    doneAt: null,
  });
  await render();
  expect(output()).toContain('Queued');
  expect(output()).toContain('Original yesterday: pay PHP 450 by Friday.');
  expect(output()).not.toContain('Completed');
});

test('detail without a selection or with a deleted message never shows a sample message', async () => {
  await render('deleted', 'EmailDetail');
  expect(output()).toContain('Message not found');
  expect(output()).not.toContain('Maya');
});

test('detail uses the original source, expands long text, and saves a category correction safely', async () => {
  const original = 'Original message '.repeat(50) + 'SOURCE END';
  await store.addMessage({ ...message('correct'), text: original }, chat);
  await store.saveRecord(
    { ...record('correct'), sensitive: true, instructionLike: true },
    'processed',
  );
  await render('correct', 'EmailDetail');
  expect(output()).toContain('MIRA SUMMARY');
  await press('Show all');
  expect(output()).toContain('SOURCE END');
  await press('Change category');
  await press('Announcement');
  const saved = await store.getItem('correct');
  expect(saved?.record?.type).toBe('announcement');
  expect(saved?.record?.sensitive).toBe(true);
  expect(saved?.record?.instructionLike).toBe(true);
  expect(saved?.message.text).toBe(original);
  expect(output()).toContain('Category saved');
});

test('a failed correction is not reported as saved', async () => {
  await seed('correct');
  await render('correct', 'EmailDetail');
  jest.spyOn(store, 'saveRecord').mockRejectedValueOnce(new Error('disk full'));
  await press('Change category');
  await press('Announcement');
  expect(output()).toContain('Could not save category');
  expect(output()).not.toContain('Category saved');
  expect((await store.getItem('correct'))?.record?.type).toBe('payment');
});

test('large reports expose a way to read beyond the first page', async () => {
  for (let i = 0; i < 201; i++) await seed(`page-${i}`);
  await render();
  expect(output()).toContain('Load more');
  await press('Load more');
  expect(output()).not.toContain('Load more');
}, 30000);

test('an older async query cannot overwrite newer stored data', async () => {
  let finishOld: (value: string) => void = () => {};
  const old = new Promise<string>(resolve => {
    finishOld = resolve;
  });
  let calls = 0;
  function Probe() {
    const state = useQuery(async () => (++calls === 1 ? old : 'newest'), []);
    return <Text>{state.data}</Text>;
  }
  await act(async () => {
    tree = Renderer.create(<Probe />);
  });
  await act(async () => {
    await store.saveChannel({
      packageName: 'new',
      label: 'New',
      enabled: false,
      level: 1,
    });
  });
  expect(output()).toContain('newest');
  await act(async () => finishOld('stale'));
  expect(output()).toContain('newest');
  expect(output()).not.toContain('stale');
});

test('Ask finds the stored message, shows the amount asked for, and opens the message', async () => {
  await seed('tuition');
  await render(undefined, 'Assistant');
  // An example fills the question; Ask sends it.
  await press('How much do I need to pay?');
  await press('Ask');
  expect(output()).toContain('Fee notice tuition');
  // The reply comes first; the source and its amount unfold under it.
  await press('Show sources');
  expect(output()).toContain('PHP 450');
  expect(output()).toContain('Original tuition: pay PHP 450 by Friday.');
  await press('Open message from Ana Santos: Fee notice tuition');
  expect(output()).toContain('Original message');
});

test('Ask says so when nothing matches', async () => {
  await render(undefined, 'Assistant');
  await press('When is the next deadline?');
  await press('Ask');
  expect(output()).toContain('I couldn’t find that in your messages.');
});

test('Today asks how MIRA can help and shows what it knows about the user so far', async () => {
  await store.saveChannel({ packageName: 'com.facebook.orca', label: 'Messenger', enabled: true, level: 2 });
  await store.saveRule({ ...BUILTIN_RULES.find(r => r.id === 'builtin-remind')!, enabled: true });
  await render();
  const text = output();
  expect(text).toContain('What can I help you with today?');
  expect(text).toContain('Everything from Messenger');
  expect(text).toContain('Due dates and payments');
  expect(text).toContain('Not yet. Tap to choose.');
  // Privacy, drafts, and apps live on Settings, Teach, and Profile now.
  expect(text).not.toContain('Privacy proof');
  expect(text).not.toContain('Connected Apps');
  await press('Ask MIRA');
  expect(output()).toContain('TRY ASKING');
});
