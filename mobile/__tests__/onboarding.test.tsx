import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { bridge } from '../src/services';
import Onboarding from '../src/screens/Onboarding';
import { PrefsProvider } from '../src/theme/prefs';

const mockGo = jest.fn();
let mockForegroundRetry: (() => void) | undefined;

jest.mock('../src/components/nav', () => ({ useGo: () => mockGo }));
jest.mock('../src/services/db/foreground', () => ({
  useForegroundRetry: (retry: () => void) => {
    mockForegroundRetry = retry;
    require('react').useEffect(() => {
      retry();
    }, [retry]);
  },
}));

function text(tree: Renderer.ReactTestRenderer) {
  return JSON.stringify(tree.toJSON());
}

function subject() {
  return (
    <SafeAreaProvider>
      <PrefsProvider>
        <NavigationContainer>
          <Onboarding />
        </NavigationContainer>
      </PrefsProvider>
    </SafeAreaProvider>
  );
}

function button(tree: Renderer.ReactTestRenderer, label: string) {
  return tree.root.find(
    node => node.props.accessibilityRole === 'button' && node.props.accessibilityLabel === label,
  );
}

beforeEach(() => {
  jest.restoreAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
  mockGo.mockClear();
  mockForegroundRetry = undefined;
});

test('permission onboarding opens settings, rechecks on return, and continues to apps', async () => {
  const enabled = jest.spyOn(bridge, 'isListenerEnabled');
  enabled.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
  const open = jest.spyOn(bridge, 'openListenerSettings').mockResolvedValue();
  let tree: Renderer.ReactTestRenderer;

  await act(async () => {
    tree = Renderer.create(subject());
  });
  expect(text(tree!)).toContain('Allow notification access');

  await act(async () => button(tree!, 'Open notification settings').props.onPress());
  expect(open).toHaveBeenCalledTimes(1);

  await act(async () => mockForegroundRetry?.());
  expect(text(tree!)).toContain('Notification access is on');

  await act(async () => button(tree!, 'Continue to Connected Apps').props.onPress());
  expect(mockGo).toHaveBeenCalledWith('ConnectedApps');

  await act(async () => tree!.unmount());
});

test('permission check errors stay visible and retryable', async () => {
  jest
    .spyOn(bridge, 'isListenerEnabled')
    .mockRejectedValueOnce(new Error('native failure'))
    .mockResolvedValueOnce(false);
  let tree: Renderer.ReactTestRenderer;

  await act(async () => {
    tree = Renderer.create(subject());
  });
  expect(text(tree!)).toContain('Could not check notification access');

  await act(async () => button(tree!, 'Check notification access').props.onPress());
  expect(text(tree!)).toContain('Notification access is off');

  await act(async () => tree!.unmount());
});
