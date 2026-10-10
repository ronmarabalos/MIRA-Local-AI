import type { Message } from '../../core/types';
import { MiraModule } from '../native/miraModule';
import { codeOf } from '../../core/modelErrors';
import { createDeviceModel } from './index';
import { complete, loadModel, unloadModel } from './llama';

jest.mock('../native/miraModule', () => ({
  MiraModule: { getModelPath: jest.fn() },
}));
jest.mock('./llama', () => {
  const state = { loaded: false };
  return {
    state,
    complete: jest.fn(),
    isModelLoaded: () => state.loaded,
    loadModel: jest.fn(async () => {
      state.loaded = true;
      return { ms: 1 };
    }),
    unloadModel: jest.fn(async () => {
      state.loaded = false;
    }),
  };
});
const llamaState = (jest.requireMock('./llama') as { state: { loaded: boolean } }).state;
beforeEach(() => {
  llamaState.loaded = false;
});

const message: Message = {
  id: 'm1',
  notificationKey: 'n1',
  packageName: 'com.facebook.orca',
  chatId: 'c1',
  sender: 'Carla',
  text: 'Org fee is due Friday.',
  postedAt: 1,
  truncated: false,
  canReply: true,
  status: 'processed',
};
const context = { chatTitle: 'ACM Org', chatKind: 'group' as const };

afterEach(() => jest.clearAllMocks());

test('with no model file, every call fails with MODEL_NOT_INSTALLED and nothing is made up', async () => {
  jest.mocked(MiraModule.getModelPath).mockResolvedValue(null);
  const model = createDeviceModel();
  const calls = [
    model.extract(message, context),
    model.draftReply(message, context),
    model.answer('When is it due?', [{ message, context }]),
    model.answerDocument('summarise', { name: 'a.pdf', passages: ['x'] }),
  ];
  for (const call of calls) {
    await expect(call.catch(codeOf)).resolves.toBe('MODEL_NOT_INSTALLED');
  }
  expect(complete).not.toHaveBeenCalled();
});

test('warm-up loads the model once, even when asked twice at the same time', async () => {
  jest.mocked(MiraModule.getModelPath).mockResolvedValue('/phone/model.gguf');
  jest.mocked(complete).mockResolvedValue({ text: 'OK', ms: 1, promptTokens: 1, outputTokens: 1, tokensPerSecond: 1 });
  const model = createDeviceModel();
  await Promise.all([model.warmUp!(), model.warmUp!()]);
  expect(loadModel).toHaveBeenCalledTimes(1);
});

test('a load that fails gives MODEL_LOAD_FAILED and is tried again next time', async () => {
  jest.mocked(MiraModule.getModelPath).mockResolvedValue('/phone/model.gguf');
  jest.mocked(loadModel).mockRejectedValueOnce(new Error('out of memory'));
  jest.mocked(complete).mockResolvedValue({ text: 'OK', ms: 1, promptTokens: 1, outputTokens: 1, tokensPerSecond: 1 });
  const model = createDeviceModel();
  await expect(model.warmUp!().catch(codeOf)).resolves.toBe('MODEL_LOAD_FAILED');
  await expect(model.warmUp!()).resolves.toEqual(expect.objectContaining({ ms: expect.any(Number) }));
  expect(loadModel).toHaveBeenCalledTimes(2);
});

test('after the file is replaced, reload lets the old model go and the next call loads the new one', async () => {
  jest.mocked(MiraModule.getModelPath).mockResolvedValue('/phone/model.gguf');
  jest.mocked(complete).mockResolvedValue({ text: 'OK', ms: 1, promptTokens: 1, outputTokens: 1, tokensPerSecond: 1 });
  const model = createDeviceModel();
  await model.warmUp!();
  await model.reload!();
  expect(unloadModel).toHaveBeenCalledTimes(1);
  await model.warmUp!();
  expect(loadModel).toHaveBeenCalledTimes(2);
});

test("the user's question is answered before messages still waiting to be read", async () => {
  jest.mocked(MiraModule.getModelPath).mockResolvedValue('/phone/model.gguf');
  const record =
    '{"s":"Fee due.","t":"payment","n":true,"u":"normal","r":null,"d":null,"a":null,"x":false,"i":false}';
  const order: string[] = [];
  let release = () => {};
  const gate = new Promise<void>(resolve => {
    release = resolve;
  });
  jest.mocked(complete).mockImplementation(async (system: string) => {
    const kind = system.includes('NOTFOUND') ? 'answer' : 'read';
    order.push(kind);
    if (order.length === 1) await gate;
    return {
      text: kind === 'answer' ? 'Due Friday (message 1).' : record,
      ms: 1,
      promptTokens: 1,
      outputTokens: 1,
      tokensPerSecond: 1,
    };
  });

  const model = createDeviceModel();
  const first = model.extract(message, context);
  const second = model.extract(message, context);
  const question = model.answer('When is it due?', [{ message, context }]);
  // Let the first read reach the model before releasing it.
  await new Promise<void>(resolve => setTimeout(resolve, 0));
  release();

  // Message numbers are dropped; the sources are shown beside the answer.
  expect(await question).toBe('Due Friday.');
  await Promise.all([first, second]);
  expect(order).toEqual(['read', 'answer', 'read']);
});
