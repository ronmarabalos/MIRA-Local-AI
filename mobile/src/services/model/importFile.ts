import { DeviceEventEmitter } from 'react-native';

import { EVENT_MODEL_IMPORT, MiraModule } from '../native/miraModule';

export interface ImportProgress {
  copied: number;
  /** -1 when the file's size is not known. */
  total: number;
}

/**
 * Lets the user pick a model file already on the phone (downloaded in their
 * browser, or copied over USB) and copies it into MIRA's folder. MIRA itself
 * never goes online. With no model loaded yet, the next message is read with
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
