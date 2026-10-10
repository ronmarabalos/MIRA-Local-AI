import { DeviceEventEmitter } from 'react-native';

import { codeOf } from '../../core/modelErrors';
import { MiraModule } from '../native/miraModule';
import { downloadModelFile, importModelFile, modelStatus, MODEL_DOWNLOAD_URL, MODEL_SHA256 } from './importFile';

jest.mock('../native/miraModule', () => ({
  ...jest.requireActual('../native/miraModule'),
  MiraModule: {
    getModelPath: jest.fn(),
    getModelStatus: jest.fn(),
    downloadModel: jest.fn(),
    importModel: jest.fn(),
    isOnline: jest.fn(async () => true),
  },
}));

const native = jest.mocked(MiraModule);
afterEach(() => jest.clearAllMocks());
const nativeError = (code: string) => Object.assign(new Error(code), { code });

describe('modelStatus', () => {
  test('reports a missing, invalid, or installed file as the phone sees it', async () => {
    native.getModelStatus.mockResolvedValueOnce('missing');
    expect(await modelStatus()).toBe('missing');
    native.getModelStatus.mockResolvedValueOnce('invalid');
    expect(await modelStatus()).toBe('invalid');
    native.getModelStatus.mockResolvedValueOnce('installed');
    expect(await modelStatus()).toBe('installed');
  });
});

describe('downloadModelFile', () => {
  test('sends only the fixed link and checksum: no message, draft, or document text', async () => {
    native.downloadModel.mockResolvedValue('downloaded');
    await downloadModelFile(() => {});
    expect(native.downloadModel).toHaveBeenCalledWith(MODEL_DOWNLOAD_URL, MODEL_SHA256);
    expect(MODEL_DOWNLOAD_URL).toMatch(/^https:\/\/huggingface\.co\/Qwen\/Qwen2\.5-1\.5B-Instruct-GGUF\//);
  });

  test('offline before installation, nothing starts and the code is MODEL_OFFLINE', async () => {
    native.isOnline.mockResolvedValueOnce(false);
    await expect(downloadModelFile(() => {}).catch(codeOf)).resolves.toBe('MODEL_OFFLINE');
    expect(native.downloadModel).not.toHaveBeenCalled();
  });

  test('native failures arrive as fixed codes', async () => {
    for (const [code, expected] of [
      ['no_space', 'MODEL_NO_SPACE'],
      ['corrupt', 'MODEL_CHECKSUM_FAILED'],
      ['not_model', 'MODEL_INVALID'],
      ['busy', 'MODEL_BUSY'],
      ['no_connection', 'MODEL_DOWNLOAD_FAILED'],
    ]) {
      native.downloadModel.mockRejectedValueOnce(nativeError(code));
      await expect(downloadModelFile(() => {}).catch(codeOf)).resolves.toBe(expected);
    }
  });

  test('a paused download resolves as cancelled, so it can be resumed', async () => {
    native.downloadModel.mockResolvedValue('cancelled');
    await expect(downloadModelFile(() => {})).resolves.toBe('cancelled');
  });

  test('progress, including the verifying step, reaches the screen until the download ends', async () => {
    const seen: unknown[] = [];
    native.downloadModel.mockImplementation(async () => {
      DeviceEventEmitter.emit('MiraModelImport', { copied: 5, total: 10 });
      DeviceEventEmitter.emit('MiraModelImport', { copied: 10, total: 10, phase: 'verifying' });
      return 'downloaded';
    });
    await downloadModelFile(p => seen.push(p));
    DeviceEventEmitter.emit('MiraModelImport', { copied: 1, total: 1 });
    expect(seen).toEqual([
      { copied: 5, total: 10 },
      { copied: 10, total: 10, phase: 'verifying' },
    ]);
  });
});

describe('importModelFile', () => {
  test('a file that is not a model, or cannot be read, arrives as a fixed code', async () => {
    native.importModel.mockRejectedValueOnce(nativeError('not_model'));
    await expect(importModelFile(() => {}).catch(codeOf)).resolves.toBe('MODEL_INVALID');
    native.importModel.mockRejectedValueOnce(nativeError('unreadable'));
    await expect(importModelFile(() => {}).catch(codeOf)).resolves.toBe('MODEL_IMPORT_FAILED');
  });
});
