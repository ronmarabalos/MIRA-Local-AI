import { NativeModules } from 'react-native';

import type { CapturedNotification } from '../../core/types';
import type { NotifyingApp, ProofFacts, ReplyResult } from '../contracts';

/** The Kotlin methods in MiraModule.kt, as they exist today. */
export interface MiraNativeModule {
  isListenerEnabled(): Promise<boolean>;
  openListenerSettings(): Promise<void>;
  getRecentNotifications(): Promise<CapturedNotification[]>;
  sendReply(key: string, text: string): Promise<ReplyResult>;
  getProofFacts(): Promise<ProofFacts>;
  getModelDir(): Promise<string | null>;
  getModelPath(): Promise<string | null>;
  /** Whether MIRA's file is there and starts like a GGUF model file. */
  getModelStatus(): Promise<'missing' | 'invalid' | 'installed'>;
  /** Opens the file picker and copies the chosen model file into MIRA's folder. */
  importModel(): Promise<'imported' | 'cancelled'>;
  /** Downloads MIRA's file into its folder, resuming an earlier part; checks the SHA-256 when given. */
  downloadModel(url: string, sha256: string | null): Promise<'downloaded' | 'cancelled'>;
  cancelModelDownload(): Promise<void>;
  /** Bytes left by an unfinished download, 0 when there is none. */
  getPartialDownloadBytes(): Promise<number>;
  /** Opens the file picker and reads the document's text on the phone; null when cancelled. */
  pickDocument(): Promise<{ name: string; text: string; pages: number; usedOcr: boolean } | null>;
  setEnabledPackages(packageNames: string[]): Promise<void>;
  listNotifyingApps(): Promise<NotifyingApp[]>;
  /** A JSON array of CapturedNotification. */
  drainInbox(): Promise<string>;
  isOnline(): Promise<boolean>;
  scheduleReminder(title: string, at: number): Promise<void>;
  cancelReminder(title: string, at: number): Promise<void>;
}

export const MiraModule: MiraNativeModule = NativeModules.MiraModule;

export const EVENT_NOTIFICATION = 'MiraNotification';
export const EVENT_ONLINE = 'MiraOnline';
export const EVENT_MODEL_IMPORT = 'MiraModelImport';
