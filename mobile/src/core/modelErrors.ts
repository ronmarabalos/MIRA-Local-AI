/**
 * Fixed codes for the model's expected failures (backend rules, section 2).
 * Screens turn these into words; nothing branches on free-text messages.
 */
export type ModelErrorCode =
  | 'MODEL_NOT_INSTALLED'
  | 'MODEL_DOWNLOAD_FAILED'
  | 'MODEL_IMPORT_FAILED'
  | 'MODEL_INVALID'
  | 'MODEL_CHECKSUM_FAILED'
  | 'MODEL_NO_SPACE'
  | 'MODEL_LOAD_FAILED'
  | 'MODEL_TIMEOUT'
  | 'MODEL_CANCELLED'
  | 'MODEL_BUSY'
  | 'MODEL_OFFLINE';

export class ModelError extends Error {
  constructor(readonly code: ModelErrorCode, message: string = code) {
    super(message);
    this.name = 'ModelError';
  }
}

/** The code of a thrown value, or null when it is not a ModelError. */
export function codeOf(error: unknown): ModelErrorCode | null {
  return error instanceof ModelError ? error.code : null;
}

const NATIVE: Record<string, ModelErrorCode> = {
  no_space: 'MODEL_NO_SPACE',
  corrupt: 'MODEL_CHECKSUM_FAILED',
  not_model: 'MODEL_INVALID',
  busy: 'MODEL_BUSY',
};

/** A code from MiraModule.kt ("no_space", "http_404", ...) as a fixed MODEL_ code. */
export function fromNative(code: string | undefined, step: 'download' | 'import'): ModelErrorCode {
  return (code && NATIVE[code]) || (step === 'download' ? 'MODEL_DOWNLOAD_FAILED' : 'MODEL_IMPORT_FAILED');
}
