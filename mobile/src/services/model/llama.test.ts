import { codeOf } from '../../core/modelErrors';
import { complete, loadModel } from './llama';

const mockCompletion = jest.fn();
const mockStopCompletion = jest.fn(async () => {});

jest.mock('llama.rn', () => ({
  initLlama: jest.fn(async () => ({ completion: mockCompletion, stopCompletion: mockStopCompletion })),
  releaseAllLlama: jest.fn(async () => {}),
}));

const reply = { content: 'OK', text: 'OK', timings: { prompt_n: 1, predicted_n: 1, predicted_per_second: 1 } };

beforeEach(async () => {
  mockCompletion.mockReset();
  mockStopCompletion.mockClear();
  await loadModel('/phone/model.gguf');
});

test('uses the model’s own chat template, temperature 0, and the token limit', async () => {
  mockCompletion.mockResolvedValue(reply);
  await complete('system', 'user', { maxTokens: 12 });
  expect(mockCompletion).toHaveBeenCalledWith(
    expect.objectContaining({ jinja: true, temperature: 0, n_predict: 12 }),
  );
});

test('a call past its time limit is stopped and fails with MODEL_TIMEOUT', async () => {
  jest.useFakeTimers();
  mockCompletion.mockImplementation(() => new Promise(() => {}));
  const pending = complete('system', 'user', { timeoutMs: 1_000 }).catch(codeOf);
  jest.advanceTimersByTime(1_000);
  await expect(pending).resolves.toBe('MODEL_TIMEOUT');
  expect(mockStopCompletion).toHaveBeenCalled();
  jest.useRealTimers();
});

test('a call that finishes in time is not stopped', async () => {
  mockCompletion.mockResolvedValue(reply);
  await expect(complete('system', 'user', { timeoutMs: 1_000 })).resolves.toEqual(
    expect.objectContaining({ text: 'OK' }),
  );
  expect(mockStopCompletion).not.toHaveBeenCalled();
});
