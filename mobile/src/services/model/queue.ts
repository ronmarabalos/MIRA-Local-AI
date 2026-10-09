export type Priority = 'user' | 'background';

/**
 * Runs one task at a time (the model can do nothing else). A task the user
 * is waiting on goes ahead of background work that has not started yet
 * (main spec 4.5).
 */
export function createTurnQueue() {
  const waiting: { priority: Priority; start(): void }[] = [];
  let busy = false;

  const next = () => {
    if (busy) return;
    const userIndex = waiting.findIndex(task => task.priority === 'user');
    const [task] = waiting.splice(userIndex === -1 ? 0 : userIndex, 1);
    if (!task) return;
    busy = true;
    task.start();
  };

  return function inTurn<T>(
    work: () => Promise<T>,
    priority: Priority = 'background',
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      waiting.push({
        priority,
        start() {
          // Starts at once; a task that throws straight away still rejects its promise.
          new Promise<T>(done => done(work()))
            .then(resolve, reject)
            .finally(() => {
              busy = false;
              next();
            });
        },
      });
      next();
    });
  };
}
