import { codeOf, fromNative, ModelError } from './modelErrors';

describe('fromNative', () => {
  test('maps every native code from MiraModule to a fixed MODEL_ code', () => {
    expect(fromNative('no_space', 'download')).toBe('MODEL_NO_SPACE');
    expect(fromNative('corrupt', 'download')).toBe('MODEL_CHECKSUM_FAILED');
    expect(fromNative('not_model', 'import')).toBe('MODEL_INVALID');
    expect(fromNative('busy', 'download')).toBe('MODEL_BUSY');
    expect(fromNative('no_connection', 'download')).toBe('MODEL_DOWNLOAD_FAILED');
    expect(fromNative('http_404', 'download')).toBe('MODEL_DOWNLOAD_FAILED');
    expect(fromNative('unreadable', 'import')).toBe('MODEL_IMPORT_FAILED');
  });

  test('an unknown code becomes the failure code of the step it came from', () => {
    expect(fromNative('something_new', 'download')).toBe('MODEL_DOWNLOAD_FAILED');
    expect(fromNative(undefined, 'import')).toBe('MODEL_IMPORT_FAILED');
  });
});

describe('ModelError', () => {
  test('carries its code, readable by codeOf on any thrown value', () => {
    const error = new ModelError('MODEL_TIMEOUT');
    expect(error).toBeInstanceOf(Error);
    expect(codeOf(error)).toBe('MODEL_TIMEOUT');
    expect(codeOf(new Error('plain'))).toBeNull();
    expect(codeOf('text')).toBeNull();
  });
});
