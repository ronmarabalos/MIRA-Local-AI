import type { Channel } from '../core/types';
import { isSetUp } from './firstRun';

const channel = (enabled: boolean): Channel => ({
  packageName: 'com.facebook.orca',
  label: 'Messenger',
  enabled,
  level: 1,
});
const deps = (access: boolean, channels: Channel[]) =>
  [
    { isListenerEnabled: async () => access },
    { getChannels: async () => channels },
  ] as const;

test('set up means notification access and at least one app switched on', async () => {
  expect(await isSetUp(...deps(true, [channel(true)]))).toBe(true);
});

test('without notification access, setup is shown again', async () => {
  expect(await isSetUp(...deps(false, [channel(true)]))).toBe(false);
});

test('with no app switched on, setup is shown again', async () => {
  expect(await isSetUp(...deps(true, [channel(false)]))).toBe(false);
  expect(await isSetUp(...deps(true, []))).toBe(false);
});
