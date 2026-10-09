import { AppState } from 'react-native';

import { getStore } from '../db';
import { bridge, model } from '../index';
import { createIntake } from './index';

/**
 * Runs intake for the life of the app: on launch, on returning to the
 * foreground, and whenever the listener captures something. Returns a
 * function that stops it.
 */
export function startIntake(): () => void {
  let stopped = false;
  let drain = () => {};

  getStore()
    .then(store => {
      const intake = createIntake({ bridge, model, store });
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
  const appState = AppState.addEventListener('change', state => {
    if (state === 'active') {
      drain();
    }
  });

  return () => {
    stopped = true;
    unsubscribe();
    appState.remove();
  };
}
