import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ModelError } from '../src/core/modelErrors';
import ModelSetupScreen from '../src/screens/ModelSetup';
import { bridge, model } from '../src/services';
import {
  cancelModelDownload,
  downloadModelFile,
  importModelFile,
  type ImportProgress,
  modelStatus,
  partialDownloadBytes,
} from '../src/services/model/importFile';
import { PrefsProvider } from '../src/theme/prefs';

jest.mock('../src/services/model/importFile', () => ({
  modelStatus: jest.fn(async () => 'missing'),
  importModelFile: jest.fn(),
  downloadModelFile: jest.fn(),
  cancelModelDownload: jest.fn(async () => {}),
  partialDownloadBytes: jest.fn(async () => 0),
  MODEL_BYTES: 1024 ** 3,
}));

const Stack = createNativeStackNavigator();
let tree: Renderer.ReactTestRenderer | undefined;

afterEach(async () => {
  if (tree) await act(async () => tree!.unmount());
  tree = undefined;
  jest.mocked(partialDownloadBytes).mockResolvedValue(0);
  jest.mocked(modelStatus).mockResolvedValue('missing');
  jest.restoreAllMocks();
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
  expect(shown()).toContain('Wi-Fi is best.');
  await press('I have it: Add MIRA’s file');
  expect(shown()).toContain('Pick the file in the list that opened');

  await act(async () => report({ copied: 512 * 1024 ** 2, total: 1024 ** 3 }));
  expect(shown()).toContain('50% · 0.50 of 1.00 GB');

  await act(async () => done('imported'));
  expect(shown()).toContain('On this phone · ready offline');
  expect(shown()).toContain('Continue');
});

test('a file that is not MIRA’s says so plainly, and the button works again', async () => {
  jest
    .mocked(importModelFile)
    .mockRejectedValue(new ModelError('MODEL_INVALID'));
  await render();
  await press('I have it: Add MIRA’s file');
  expect(shown()).toContain('That isn’t MIRA’s file. Pick the one ending in .gguf.');
  expect(shown()).toContain('Not on this phone yet');
});

test('cancelling the picker leaves the screen as it was', async () => {
  jest.mocked(importModelFile).mockResolvedValue('cancelled');
  await render();
  await press('I have it: Add MIRA’s file');
  expect(shown()).toContain('Not on this phone yet');
  expect(shown()).toContain('Continue for now');
});

test('Download fetches MIRA’s file by itself, with progress, and can be paused', async () => {
  let report!: (p: ImportProgress) => void;
  let done!: (r: 'downloaded' | 'cancelled') => void;
  jest.mocked(downloadModelFile).mockImplementation(
    onProgress =>
      new Promise(resolve => {
        report = onProgress;
        done = resolve;
      }),
  );
  await render();
  await press('Download MIRA’s file');
  expect(shown()).toContain('Connecting…');
  expect(shown()).toContain('Downloading to this phone…');

  await act(async () => report({ copied: 256 * 1024 ** 2, total: 1024 ** 3 }));
  expect(shown()).toContain('Downloading… 25% · 0.25 of 1.00 GB');

  await press('Pause download');
  expect(cancelModelDownload).toHaveBeenCalled();
  jest.mocked(partialDownloadBytes).mockResolvedValue(256 * 1024 ** 2);
  await act(async () => done('cancelled'));
  expect(shown()).toContain('Resume download (0.25 of 1.00 GB done)');
});

test('a finished download makes MIRA ready', async () => {
  jest.mocked(downloadModelFile).mockResolvedValue('downloaded');
  await render();
  await press('Download MIRA’s file');
  expect(shown()).toContain('On this phone · ready offline');
  expect(shown()).toContain('Continue');
});

test('a dropped connection says how to carry on', async () => {
  jest
    .mocked(downloadModelFile)
    .mockRejectedValue(new ModelError('MODEL_DOWNLOAD_FAILED'));
  await render();
  await press('Download MIRA’s file');
  expect(shown()).toContain('The download stopped. Check your connection, then tap Resume.');
});

const status = () =>
  tree!.root.findAll(n => typeof n.props.accessibilityLabel === 'string' && n.props.accessibilityLabel.startsWith('Status: '))[0]
    ?.props.accessibilityLabel;

test('says plainly where MIRA runs and what the internet is for', async () => {
  await render();
  const text = shown();
  expect(text).toContain('MIRA runs on this phone.');
  expect(text).toContain('Install MIRA’s file before MIRA can read and answer.');
  expect(text).toContain('Internet is only needed to download it.');
  expect(text).toContain('After that, MIRA works in airplane mode.');
  expect(text).toContain('Your messages never go to Open WebUI or any online AI.');
  expect(status()).toBe('Status: Not on this phone yet');
});

test('a paused download says how much is done', async () => {
  jest.mocked(partialDownloadBytes).mockResolvedValue(256 * 1024 ** 2);
  await render();
  expect(status()).toBe('Status: Paused · 0.25 of 1.00 GB');
  expect(shown()).toContain('Resume download');
});

test('the finished file is checked before it is used', async () => {
  let report!: (p: ImportProgress) => void;
  jest.mocked(downloadModelFile).mockImplementation(onProgress => {
    report = onProgress;
    return new Promise(() => {});
  });
  await render();
  await press('Download MIRA’s file');
  await act(async () => report({ copied: 10, total: 10, phase: 'verifying' }));
  expect(status()).toBe('Status: Checking the file…');
});

test('a file on the phone that is not a model is called out, with a way to replace it', async () => {
  jest.mocked(modelStatus).mockResolvedValue('invalid');
  await render();
  expect(status()).toBe('Status: The file on this phone isn’t a model');
  expect(shown()).toContain('Download MIRA’s file');
});

test('each failure code has its own plain message', async () => {
  for (const [code, words] of [
    ['MODEL_CHECKSUM_FAILED', 'The download was damaged, so it was deleted. Try again.'],
    ['MODEL_NO_SPACE', 'Not enough free space.'],
    ['MODEL_OFFLINE', 'You’re offline. Connect to the internet to download MIRA’s file.'],
  ] as const) {
    jest.mocked(downloadModelFile).mockRejectedValueOnce(new ModelError(code));
    await render();
    await press('Download MIRA’s file');
    expect(shown()).toContain(words);
    await act(async () => tree!.unmount());
    tree = undefined;
  }
});

test('a new file is loaded fresh: the old model is let go', async () => {
  const reload = jest.spyOn(model, 'reload');
  jest.mocked(downloadModelFile).mockResolvedValue('downloaded');
  await render();
  await press('Download MIRA’s file');
  expect(reload).toHaveBeenCalled();
});

test('installed: Test MIRA loads the model and answers on the phone, offline too', async () => {
  jest.mocked(modelStatus).mockResolvedValue('installed');
  jest.spyOn(bridge, 'isOnline').mockResolvedValue(false);
  let finish!: (v: { ms: number }) => void;
  jest.spyOn(model, 'warmUp').mockImplementation(() => new Promise(resolve => (finish = resolve)));
  await render();
  expect(status()).toBe('Status: Ready · works offline');
  await press('Test MIRA');
  expect(status()).toBe('Status: Loading MIRA…');
  await act(async () => finish({ ms: 4200 }));
  expect(status()).toBe('Status: Loaded · answered on this phone in 4.2 s');
});

test('a model that will not load says so and can be tried again', async () => {
  jest.mocked(modelStatus).mockResolvedValue('installed');
  jest.spyOn(model, 'warmUp').mockRejectedValue(new ModelError('MODEL_LOAD_FAILED'));
  await render();
  await press('Test MIRA');
  expect(shown()).toContain('MIRA’s file couldn’t be loaded.');
  expect(status()).toBe('Status: On this phone · ready offline');
});
