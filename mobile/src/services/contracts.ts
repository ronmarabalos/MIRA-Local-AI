/**
 * The boundary between the two lanes. Lane A implements these against the
 * phone; Lane B builds against the fakes in ./fakes. Frozen after Phase 0.
 */
import type {
  CapturedNotification,
  ChatKind,
  ExtractedRecord,
  Message,
} from '../core/types';

export type Unsubscribe = () => void;

export interface NotifyingApp {
  packageName: string;
  label: string;
}

/** `gone` means the notification is no longer showing, so it cannot be answered. */
export type ReplyResult = 'sent' | 'gone';

export interface ProofFacts {
  hasInternetPermission: boolean;
  /** Bytes sent by this app since install, or null if Android will not say. */
  bytesSent: number | null;
  isDebugBuild: boolean;
}

/** The Kotlin bridge (spec 4.2). */
export interface NativeBridge {
  isListenerEnabled(): Promise<boolean>;
  openListenerSettings(): Promise<void>;
  setEnabledPackages(packageNames: string[]): Promise<void>;
  listNotifyingApps(): Promise<NotifyingApp[]>;
  /** Captured notifications not yet handed over. Each is returned once. */
  drainInbox(): Promise<CapturedNotification[]>;
  /** Called when the inbox has something new. Call drainInbox to get it. */
  onNotification(listener: () => void): Unsubscribe;
  sendReply(notificationKey: string, text: string): Promise<ReplyResult>;
  /** Posts a local notification at the given time (epoch milliseconds). */
  scheduleReminder(title: string, at: number): Promise<void>;
  /** Cancels a reminder set with the same title and time. Does nothing if it has already fired. */
  cancelReminder(title: string, at: number): Promise<void>;
  isOnline(): Promise<boolean>;
  onOnlineChange(listener: (online: boolean) => void): Unsubscribe;
  getProofFacts(): Promise<ProofFacts>;
}

export interface MessageContext {
  chatTitle: string;
  chatKind: ChatKind;
}

/** One message given to the model as the basis for an answer. */
export interface AnswerSource {
  message: Message;
  context: MessageContext;
}

/** The local model (spec 4.5). One request runs at a time. */
export interface ModelService {
  /** Rejects when the output cannot be parsed; the caller retries once. */
  extract(message: Message, context: MessageContext): Promise<ExtractedRecord>;
  /** Reply text of at most 60 words. */
  draftReply(message: Message, context: MessageContext): Promise<string>;
  /**
   * One or two sentences answering the question from these messages only.
   * Rejects when there is no usable answer; the caller shows the sources alone.
   */
  answer(question: string, sources: AnswerSource[]): Promise<string>;
}
