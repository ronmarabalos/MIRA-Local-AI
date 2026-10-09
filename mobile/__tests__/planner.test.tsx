import React from 'react';
import { AppState } from 'react-native';
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

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const now = new Date();
/** Noon on a day counted from today, in local time. */
const noon = (daysFromToday: number) =>
  new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + daysFromToday,
    12,
    0,
  ).getTime();

async function add(
  id: string,
  summary: string,
  dateAt: number | null,
  dateText = 'a date',
  text = `Original ${id}`,
) {
  await db.store.addMessage(
    {
      id,
      notificationKey: id,
      packageName: 'com.facebook.orca',
      chatId: 'c1',
      sender: 'Carla',
      text,
      postedAt: Date.now() - 60_000,
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
  await db.store.saveChannel({
    packageName: 'com.facebook.orca',
    label: 'Messenger',
    enabled: true,
    level: 2,
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

async function render(view?: 'tasks' | 'calendar') {
  await act(() => {
    tree = Renderer.create(
      <SafeAreaProvider>
        <PrefsProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen
                name="Planner"
                component={PlannerScreen}
                initialParams={view ? { view } : undefined}
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
      id: 'a1',
      ruleId: 'builtin-remind',
      messageId: 't1',
      kind: 'remind',
      payload: {},
      status: 'done',
      reason: null,
      createdAt: Date.now(),
      doneAt: Date.now(),
    });
    await render();
    const text = shown();
    const order = [
      'Today',
      'Due today.',
      'Tomorrow',
      'Due tomorrow.',
      'This week',
      'Due in three days.',
      'Later',
      'Due in nine days.',
      'No exact date',
      'Due sometime.',
      'Passed',
      'Was due two days ago.',
    ];
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

describe('Tasks, honest and current', () => {
  test('a time is shown only when the message gave one', async () => {
    await add('d1', 'Day only.', noon(3), 'oct 20', 'oct 20 is the deadline');
    // Stored as the verifier would store it: 11:59 PM on that day.
    await add(
      'd2',
      'Day and time.',
      noon(4) + (11 * 60 + 59) * 60_000,
      '11:59pm',
      'submit it at 11:59pm',
    );
    await render();
    const text = shown();
    expect(text).not.toContain('12:00');
    expect(text).toContain('11:59');
  });

  test('the app names are read once for the whole list, not once per row', async () => {
    for (let i = 1; i <= 6; i += 1) await add(`c${i}`, `Entry ${i}.`, noon(i));
    const getChannels = jest.spyOn(db.store, 'getChannels');
    await render();
    expect(shown()).toContain('Messenger · ACM Org');
    expect(getChannels.mock.calls.length).toBeLessThanOrEqual(2);
  });

  test("after midnight, coming back to the app moves tomorrow's entry under Today", async () => {
    const handlers: ((state: string) => void)[] = [];
    jest.spyOn(AppState, 'addEventListener').mockImplementation(((
      _event: string,
      handler: (state: string) => void,
    ) => {
      handlers.push(handler);
      return { remove: () => {} };
    }) as never);
    await add('t1', 'Due tomorrow.', noon(1));
    await render();
    expect(shown()).toContain('Tomorrow');

    const real = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(real + 24 * 60 * 60 * 1000);
    await act(() => {
      handlers.forEach(handler => handler('active'));
    });
    await settle();
    const text = shown();
    expect(text).toContain('Today');
    expect(text).not.toContain('Tomorrow');
    expect(text).toContain('Due tomorrow.');
  });
});

describe('Calendar', () => {
  test("opens on this month with today selected, and lists today's entries", async () => {
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
    await add(
      'n2',
      'Second thing on the fifteenth.',
      next.getTime() + 3_600_000,
    );
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
