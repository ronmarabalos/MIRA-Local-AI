import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import KeepWordsScreen from '../src/screens/KeepWords';
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
  await db.store.saveChannel({ packageName: 'com.facebook.orca', label: 'Messenger', enabled: true, level: 1 });
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
              <Stack.Screen name="KeepWords" component={KeepWordsScreen} />
              <Stack.Screen name="ConnectedApps" component={() => null} />
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

test('typing a word keeps messages that say it; it can be removed again', async () => {
  await render();
  expect(shown()).toContain('No words yet. I keep everything.');

  await act(async () => find('A word to look for').props.onChangeText('  Announcement '));
  await press('Add word');
  expect(await db.store.getKeepWords()).toEqual(['announcement']);
  expect(shown()).toContain('I keep messages that say');

  await press('Remove announcement');
  expect(await db.store.getKeepWords()).toEqual([]);
});

test('a suggested word is added with one tap, and the apps are listed with Add an app', async () => {
  await render();
  await press('Add exam');
  expect(await db.store.getKeepWords()).toEqual(['exam']);
  expect(shown()).toContain('Messenger');
  expect(find('Add an app')).toBeDefined();
});
