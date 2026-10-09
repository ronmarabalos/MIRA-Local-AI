import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import ModelSetupScreen from '../src/screens/ModelSetup';
import { importModelFile, type ImportProgress } from '../src/services/model/importFile';
import { PrefsProvider } from '../src/theme/prefs';

jest.mock('../src/services/firstRun', () => ({ isModelOnPhone: jest.fn(async () => false) }));
jest.mock('../src/services/model/importFile', () => ({ importModelFile: jest.fn() }));

const Stack = createNativeStackNavigator();
let tree: Renderer.ReactTestRenderer | undefined;

afterEach(async () => {
  if (tree) await act(async () => tree!.unmount());
  tree = undefined;
});

async function render() {
  await act(async () => {
    tree = Renderer.create(
      <SafeAreaProvider>
        <PrefsProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="ModelSetup" component={ModelSetupScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </PrefsProvider>
      </SafeAreaProvider>,
    );
  });
}

const shown = () => JSON.stringify(tree!.toJSON());

function press(label: string) {
  const node = tree!.root
    .findAll(n => n.props.accessibilityLabel === label && typeof n.props.onPress === 'function')[0];
  expect(node).toBeDefined();
  return act(async () => {
    node.props.onPress();
  });
}

test('adds the file the user picks, showing progress, then offers to finish', async () => {
  let report!: (p: ImportProgress) => void;
  let done!: (r: 'imported') => void;
  jest.mocked(importModelFile).mockImplementation(
    onProgress =>
      new Promise(resolve => {
        report = onProgress;
        done = resolve;
      }),
  );
  await render();
  expect(shown()).toContain('MIRA never goes online.');
  await press('Add MIRA’s file');
  expect(shown()).toContain('Pick the file in the list that opened');

  await act(async () => report({ copied: 512 * 1024 ** 2, total: 1024 ** 3 }));
  expect(shown()).toContain('50% · 0.50 of 1.00 GB');

  await act(async () => done('imported'));
  expect(shown()).toContain('On this phone · ready offline');
  expect(shown()).toContain('Finish setup');
});

test('a file that is not MIRA’s says so plainly, and the button works again', async () => {
  jest
    .mocked(importModelFile)
    .mockRejectedValue(Object.assign(new Error('x'), { code: 'not_model' }));
  await render();
  await press('Add MIRA’s file');
  expect(shown()).toContain('That isn’t MIRA’s file. Pick the one ending in .gguf.');
  expect(shown()).toContain('Not on this phone yet');
});

test('cancelling the picker leaves the screen as it was', async () => {
  jest.mocked(importModelFile).mockResolvedValue('cancelled');
  await render();
  await press('Add MIRA’s file');
  expect(shown()).toContain('Not on this phone yet');
  expect(shown()).toContain('Continue for now');
});
