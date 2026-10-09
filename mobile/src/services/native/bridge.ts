import { DeviceEventEmitter } from 'react-native';

import type { CapturedNotification } from '../../core/types';
import type { NativeBridge } from '../contracts';
import {
  EVENT_NOTIFICATION,
  EVENT_ONLINE,
  MiraModule,
  type MiraNativeModule,
} from './miraModule';

interface Events {
  addListener(
    event: string,
    listener: (payload: never) => void,
  ): { remove(): void };
}

/** The real bridge, plus a way to feed it notifications by hand in development. */
export interface DeviceBridge extends NativeBridge {
  /** Adds notifications as if the listener had captured them. */
  inject(notifications: CapturedNotification[]): void;
}

export function createNativeBridge(
  native: MiraNativeModule = MiraModule,
  events: Events = DeviceEventEmitter,
): DeviceBridge {
  let injected: CapturedNotification[] = [];
  const injectListeners = new Set<() => void>();

  return {
    isListenerEnabled: () => native.isListenerEnabled(),
    openListenerSettings: () => native.openListenerSettings(),
    setEnabledPackages: packageNames => native.setEnabledPackages(packageNames),
    listNotifyingApps: () => native.listNotifyingApps(),
    async drainInbox() {
      const captured = JSON.parse(
        await native.drainInbox(),
      ) as CapturedNotification[];
      const all = [...injected, ...captured];
      injected = [];
      return all;
    },
    onNotification(listener) {
      const subscription = events.addListener(EVENT_NOTIFICATION, listener);
      injectListeners.add(listener);
      return () => {
        subscription.remove();
        injectListeners.delete(listener);
      };
    },
    sendReply: (key, text) => native.sendReply(key, text),
    scheduleReminder: (title, at) => native.scheduleReminder(title, at),
    isOnline: () => native.isOnline(),
    onOnlineChange(listener) {
      const subscription = events.addListener(EVENT_ONLINE, listener);
      return () => subscription.remove();
    },
    getProofFacts: () => native.getProofFacts(),
    inject(notifications) {
      injected.push(...notifications);
      injectListeners.forEach(listener => listener());
    },
  };
}
