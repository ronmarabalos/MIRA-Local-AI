import { NativeModules } from 'react-native';

import type { NativeBridge } from './contracts';
import type { Store } from './db';

/**
 * True once the user has been through setup: MIRA has notification access
 * and at least one app is switched on. Both live on the phone, so nothing
 * extra has to be remembered.
 */
export async function isSetUp(
  bridge: Pick<NativeBridge, 'isListenerEnabled'>,
  store: Pick<Store, 'getChannels'>,
): Promise<boolean> {
  if (!(await bridge.isListenerEnabled())) return false;
  return (await store.getChannels()).some(channel => channel.enabled);
}

/** Whether the model file has been copied to this phone. False off a device. */
export async function isModelOnPhone(): Promise<boolean> {
  const native = NativeModules.MiraModule as
    | { getModelPath?: () => Promise<string | null> }
    | undefined;
  if (!native?.getModelPath) return false;
  return (await native.getModelPath()) !== null;
}
