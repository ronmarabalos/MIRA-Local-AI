import type { CapturedNotification } from '../../core/types';
import type { NativeBridge, ProofFacts } from '../contracts';

/** A bridge with no phone behind it, plus controls for tests and fixtures. */
export interface FakeBridge extends NativeBridge {
  /** Simulates a notification being posted. */
  push(notification: CapturedNotification): void;
  setOnline(online: boolean): void;
  readonly sentReplies: { key: string; text: string }[];
  readonly reminders: { title: string; at: number }[];
}

const DEBUG_FACTS: ProofFacts = {
  hasInternetPermission: true,
  bytesSent: null,
  isDebugBuild: true,
};

export function createFakeBridge(seed: CapturedNotification[] = []): FakeBridge {
  let inbox = [...seed];
  let enabled: Set<string> | null = null;
  let online = true;
  const replyable = new Set(seed.filter(n => n.canReply).map(n => n.key));
  const notificationListeners = new Set<() => void>();
  const onlineListeners = new Set<(online: boolean) => void>();
  const sentReplies: { key: string; text: string }[] = [];
  const reminders: { title: string; at: number }[] = [];

  return {
    sentReplies,
    reminders,
    push(notification) {
      if (enabled && !enabled.has(notification.packageName)) {
        return;
      }
      inbox.push(notification);
      if (notification.canReply) {
        replyable.add(notification.key);
      }
      notificationListeners.forEach(listener => listener());
    },
    setOnline(next) {
      online = next;
      onlineListeners.forEach(listener => listener(next));
    },
    async isListenerEnabled() {
      return true;
    },
    async openListenerSettings() {},
    async setEnabledPackages(packageNames) {
      enabled = new Set(packageNames);
    },
    async listNotifyingApps() {
      return [
        { packageName: 'com.facebook.orca', label: 'Messenger' },
        { packageName: 'com.google.android.gm', label: 'Gmail' },
        { packageName: 'com.google.android.apps.messaging', label: 'Messages' },
      ];
    },
    async drainInbox() {
      const drained = inbox;
      inbox = [];
      return drained;
    },
    onNotification(listener) {
      notificationListeners.add(listener);
      return () => notificationListeners.delete(listener);
    },
    async sendReply(key, text) {
      if (!replyable.has(key)) {
        return 'gone';
      }
      sentReplies.push({ key, text });
      return 'sent';
    },
    async scheduleReminder(title, at) {
      reminders.push({ title, at });
    },
    async isOnline() {
      return online;
    },
    onOnlineChange(listener) {
      onlineListeners.add(listener);
      return () => onlineListeners.delete(listener);
    },
    async getProofFacts() {
      return DEBUG_FACTS;
    },
  };
}
