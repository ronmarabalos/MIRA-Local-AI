import { DeviceEventEmitter } from 'react-native';

import { EVENT_MODEL_IMPORT, MiraModule } from '../native/miraModule';

/**
 * Where MIRA's file comes from: Qwen2.5 1.5B Instruct, 4-bit (Q4_K_M), the
 * model measured in tasks A1.1 and A2.2. Downloading it is the only use of
 * the internet permission.
 */
export const MODEL_DOWNLOAD_URL =
  'https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf';
/** The file's SHA-256 as Hugging Face publishes it; a download that differs is thrown away. */
export const MODEL_SHA256 = '6a1a2eb6d15622bf3c96857206351ba97e1af16c30d7a74ee38970e434e9407e';
export const MODEL_BYTES = 1_117_320_736;

export interface ImportProgress {
  copied: number;
  /** -1 when the file's size is not known. */
  total: number;
}

/**
 * Downloads MIRA's file onto the phone by itself, resuming an earlier part,
 * and installs it once its checksum matches. Same loading rules as an import.
 */
export async function downloadModelFile(
  onProgress: (progress: ImportProgress) => void,
): Promise<'downloaded' | 'cancelled'> {
  const sub = DeviceEventEmitter.addListener(EVENT_MODEL_IMPORT, onProgress);
  try {
    return await MiraModule.downloadModel(MODEL_DOWNLOAD_URL, MODEL_SHA256);
  } finally {
    sub.remove();
  }
}

export const cancelModelDownload = () => MiraModule.cancelModelDownload();

/** Bytes an earlier download left, so the screen can say "Resume". 0 off a device. */
export async function partialDownloadBytes(): Promise<number> {
  return MiraModule?.getPartialDownloadBytes?.().catch(() => 0) ?? 0;
}

/**
 * Lets the user pick a model file already on the phone (copied over USB, or
 * downloaded elsewhere) and copies it into MIRA's folder. With no model loaded yet, the next message is read with
 * it; a model already in use is replaced the next time MIRA opens, so a
 * message being read is never cut off.
 */
export async function importModelFile(
  onProgress: (progress: ImportProgress) => void,
): Promise<'imported' | 'cancelled'> {
  const sub = DeviceEventEmitter.addListener(EVENT_MODEL_IMPORT, onProgress);
  try {
    return await MiraModule.importModel();
  } finally {
    sub.remove();
  }
}
