import { AppState } from 'react-native';

import { getActionRunner } from '../actions/runner';
import { getStore } from '../db';
import { bridge, model } from '../index';
import { createIntake } from './index';

/**
 * Runs intake for the life of the app: on launch, on returning to the
 * foreground, and whenever the listener captures something. Each message the
 * model reads is passed to the action runner, which applies the user's rules. Returns a
 * function that stops it.
 */
export function startIntake(): () => void {
  let stopped = false;
  let drain = () => {};
  let flush = () => {};

  Promise.all([getStore(), getActionRunner()])
    .then(([store, runner]) => {
      const intake = createIntake({
        bridge,
        model,
        store,
        onProcessed: item => runner.onRecord(item),
      });
      flush = () => {
        runner
          .flushQueue()
          .catch(error => console.warn('MIRA queue failed', String(error)));
      };
      drain = () => {
        if (!stopped) {
          intake
            .drain()
            .catch(error => console.warn('MIRA intake failed', String(error)));
        }
      };
      drain();
    })
    .catch(error => console.warn('MIRA storage failed to open', String(error)));

  const unsubscribe = bridge.onNotification(() => drain());
  // Replies approved while offline go out when the connection returns.
  const offOnline = bridge.onOnlineChange(online => {
    if (online && !stopped) {
      flush();
    }
  });
  const appState = AppState.addEventListener('change', state => {
    if (state === 'active') {
      drain();
    }
  });

  return () => {
    stopped = true;
    unsubscribe();
    offOnline();
    appState.remove();
  };
}
