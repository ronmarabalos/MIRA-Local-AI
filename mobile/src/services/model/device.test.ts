import type { Message } from '../../core/types';
import type { ModelService } from '../contracts';
import { MiraModule } from '../native/miraModule';
import { createDeviceModel } from './index';
import { complete } from './llama';

jest.mock('../native/miraModule', () => ({
  MiraModule: { getModelPath: jest.fn() },
}));
jest.mock('./llama', () => {
  let loaded = false;
  return {
    complete: jest.fn(),
    isModelLoaded: () => loaded,
    loadModel: jest.fn(async () => {
      loaded = true;
      return { ms: 1 };
    }),
  };
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

/** A stand-in model whose answer is watched, to prove it is never used for answering. */
function fallback() {
  const answer = jest.fn(async () => 'a made-up sentence');
  const model: ModelService = {
    extract: async () => ({
      type: 'other',
      summary: 'from the fallback',
      needs_user: false,
      urgency: 'normal',
      request: null,
      date_text: null,
      amount: null,
      sensitive: false,
      instruction_like: false,
    }),
    draftReply: async () => 'fallback draft',
    answer,
  };
  return { model, answer };
}

afterEach(() => jest.clearAllMocks());

test('with no model file on the phone, answering fails and the stand-in is never used', async () => {
  jest.mocked(MiraModule.getModelPath).mockResolvedValue(null);
  const standIn = fallback();
  const model = createDeviceModel(standIn.model);
  await expect(
    model.answer('When is it due?', [{ message, context }]),
  ).rejects.toThrow(/not on this phone/);
  expect(standIn.answer).not.toHaveBeenCalled();
  // Reading a message still falls back, so the app works on an emulator.
  expect((await model.extract(message, context)).summary).toBe(
    'from the fallback',
  );
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
    const kind = system.startsWith('You answer') ? 'answer' : 'read';
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

  const model = createDeviceModel(fallback().model);
  const first = model.extract(message, context);
  const second = model.extract(message, context);
  const question = model.answer('When is it due?', [{ message, context }]);
  // Let the first read reach the model before releasing it.
  await new Promise<void>(resolve => setTimeout(resolve, 0));
  release();

  expect(await question).toBe('Due Friday (message 1).');
  await Promise.all([first, second]);
  expect(order).toEqual(['read', 'answer', 'read']);
});
