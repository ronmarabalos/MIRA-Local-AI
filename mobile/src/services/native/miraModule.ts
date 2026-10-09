import { NativeModules } from 'react-native';

import type { CapturedNotification } from '../../core/types';
import type { ProofFacts, ReplyResult } from '../contracts';

/** The Kotlin methods in MiraModule.kt, as they exist today. */
export interface MiraNativeModule {
  isListenerEnabled(): Promise<boolean>;
  openListenerSettings(): Promise<void>;
  getRecentNotifications(): Promise<CapturedNotification[]>;
  sendReply(key: string, text: string): Promise<ReplyResult>;
  getProofFacts(): Promise<ProofFacts>;
  getModelDir(): Promise<string | null>;
}

export const MiraModule: MiraNativeModule = NativeModules.MiraModule;
