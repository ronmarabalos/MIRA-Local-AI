import { createTurnQueue } from './queue';

const deferred = () => {
  let release = () => {};
  const promise = new Promise<void>(resolve => {
    release = resolve;
  });
  return { promise, release };
};

test('runs one task at a time, and a user task ahead of background tasks already waiting', async () => {
  const inTurn = createTurnQueue();
  const order: string[] = [];
  const gate = deferred();

  const first = inTurn(async () => {
    order.push('background 1 start');
    await gate.promise;
    order.push('background 1 end');
  });
  const second = inTurn(async () => {
    order.push('background 2');
  });
  const question = inTurn(async () => {
    order.push('user');
    return 'answer';
  }, 'user');

  expect(order).toEqual(['background 1 start']);
  gate.release();
  expect(await question).toBe('answer');
  await Promise.all([first, second]);
  expect(order).toEqual([
    'background 1 start',
    'background 1 end',
    'user',
    'background 2',
  ]);
});

test('a failing task rejects its own promise and the queue carries on', async () => {
  const inTurn = createTurnQueue();
  const failed = inTurn(async () => {
    throw new Error('boom');
  });
  const after = inTurn(async () => 'still running');
  await expect(failed).rejects.toThrow('boom');
  expect(await after).toBe('still running');
});

test('a task that throws before returning a promise still rejects, and the queue carries on', async () => {
  const inTurn = createTurnQueue();
  const failed = inTurn((() => {
    throw new Error('thrown at once');
  }) as () => Promise<string>);
  const after = inTurn(async () => 'still running');
  await expect(failed).rejects.toThrow('thrown at once');
  expect(await after).toBe('still running');
});
