import type { AskMatch } from '../core/ask';
import type { ReportItem } from '../core/report';
import { createAsk } from './ask';

const NOW = Date.UTC(2026, 9, 10, 12, 0);

const stored: ReportItem = {
  message: {
    id: 'm1',
    notificationKey: 'n1',
    packageName: 'com.facebook.orca',
    chatId: 'c1',
    sender: 'Carla',
    text: 'Org fee of 150 pesos is due this Friday.',
    postedAt: NOW - 3_600_000,
    truncated: false,
    canReply: true,
    status: 'processed',
  },
  chat: {
    id: 'c1',
    packageName: 'com.facebook.orca',
    title: 'ACM Org',
    kind: 'group',
  },
  record: {
    messageId: 'm1',
    type: 'payment',
    summary: 'Org fee is due Friday.',
    needsUser: true,
    urgency: 'normal',
    request: null,
    amount: '150 pesos',
    dateText: 'this Friday',
    dateAt: null,
    sensitive: false,
    instructionLike: false,
    duplicateOf: null,
  },
};

function setup(answer: () => Promise<string>) {
  const getItems = jest.fn(
    async (_from: number, _to: number, _limit?: number) => [stored],
  );
  const model = { answer: jest.fn(answer) };
  return {
    getItems,
    model,
    ask: createAsk({ store: { getItems }, model, now: () => NOW }),
  };
}

test('findSources searches the last 14 days of stored messages', async () => {
  const { ask, getItems } = setup(async () => 'x');
  const { matches, exact } = await ask.findSources('when is the org fee due?');
  expect(exact).toBe(true);
  expect(matches.map(m => m.item.message.id)).toEqual(['m1']);
  expect(matches[0].fact).toEqual({ kind: 'date', text: 'this Friday' });
  const [from, to] = getItems.mock.calls[0];
  expect(NOW - from).toBe(14 * 24 * 3_600_000);
  expect(to).toBeGreaterThan(NOW);
});

test('a broad question with no keyword match gets the messages that most need the user', async () => {
  const { ask } = setup(async () => 'x');
  const { matches, exact } = await ask.findSources('anything I should know?');
  expect(exact).toBe(false);
  expect(matches.map(m => m.item.message.id)).toEqual(['m1']);
});

test('explain gives the model the question and each source with its chat and what MIRA read', async () => {
  const { ask, model } = setup(async () => 'Your org fee is due this Friday.');
  const { matches } = await ask.findSources('org fee');
  expect(await ask.explain('org fee', matches)).toBe(
    'Your org fee is due this Friday.',
  );
  expect(model.answer).toHaveBeenCalledWith('org fee', [
    {
      message: stored.message,
      context: { chatTitle: 'ACM Org', chatKind: 'group' },
      record: stored.record,
    },
  ]);
});

test('explain returns null, and does not throw, when the model fails', async () => {
  const { ask } = setup(async () => {
    throw new Error('The model file is not on this phone.');
  });
  const { matches } = await ask.findSources('org fee');
  await expect(ask.explain('org fee', matches)).resolves.toBeNull();
});

test('explain does not call the model when there is nothing to explain', async () => {
  const { ask, model } = setup(async () => 'x');
  const none: AskMatch[] = [];
  expect(await ask.explain('org fee', none)).toBeNull();
  expect(model.answer).not.toHaveBeenCalled();
});
