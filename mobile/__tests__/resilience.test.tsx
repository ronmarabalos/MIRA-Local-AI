import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';

import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { PrefsProvider, usePrefs, type PrefsStorage } from '../src/theme/prefs';
import { testStore } from '../test-support/sqlite';

const text = (tree: Renderer.ReactTestRenderer) => JSON.stringify(tree.toJSON());

describe('ErrorBoundary', () => {
  it('shows a way back instead of a blank screen, and draws the app again on retry', async () => {
    let fail = true;
    function Fragile() {
      if (fail) throw new Error('boom');
      return <Text>Today</Text>;
    }
    const quiet = jest.spyOn(console, 'error').mockImplementation(() => {});
    let tree!: Renderer.ReactTestRenderer;
    await act(async () => {
      tree = Renderer.create(<ErrorBoundary><Fragile /></ErrorBoundary>);
    });
    expect(text(tree)).toContain('Something went wrong');
    expect(text(tree)).toContain('Nothing was sent.');

    fail = false;
    await act(async () => {
      tree.root.findAll(n => n.props.accessibilityLabel === 'Try again' && typeof n.props.onPress === 'function')[0].props.onPress();
    });
    expect(text(tree)).toContain('Today');
    expect(text(tree)).not.toContain('Something went wrong');
    quiet.mockRestore();
    await act(async () => tree.unmount());
  });
});

describe('PrefsProvider', () => {
  let prefs!: ReturnType<typeof usePrefs>;
  function Probe() {
    prefs = usePrefs();
    return <Text>{`${prefs.name}|${prefs.theme}|${prefs.reduceMotionSetting}`}</Text>;
  }

  it('loads stored choices on start and saves each change', async () => {
    const { store } = await testStore();
    await store.setPref('name', 'Alex');
    await store.setPref('theme', 'system');
    const storage: PrefsStorage = { load: () => store.getPrefs(), save: (k, v) => store.setPref(k, v) };

    let tree!: Renderer.ReactTestRenderer;
    await act(async () => {
      tree = Renderer.create(<PrefsProvider storage={storage}><Probe /></PrefsProvider>);
    });
    expect(text(tree)).toContain('Alex|system|false');

    await act(async () => {
      prefs.setReduceMotionSetting(true);
      prefs.setName('Sam');
    });
    expect(await store.getPrefs()).toEqual({ name: 'Sam', theme: 'system', reduceMotion: '1' });
    await act(async () => tree.unmount());
  });

  it('keeps working in memory when storage cannot open', async () => {
    const broken = new Error('no database');
    const storage: PrefsStorage = { load: () => Promise.reject(broken), save: () => Promise.reject(broken) };
    let tree!: Renderer.ReactTestRenderer;
    await act(async () => {
      tree = Renderer.create(<PrefsProvider storage={storage}><Probe /></PrefsProvider>);
    });
    await act(async () => prefs.setName('Sam'));
    expect(text(tree)).toContain('Sam|light|false');
    await act(async () => tree.unmount());
  });
});
