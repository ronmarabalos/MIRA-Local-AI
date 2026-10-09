import { BUILTIN_RULES } from '../../core/builtinRules';
import { getStore } from '../db';
import { bridge, model } from '../index';
import { type ActionRunner, createActionRunner } from './index';

let ready: Promise<ActionRunner> | null = null;

/**
 * The app's one action runner. On first use it also makes sure the built-in
 * rules exist in storage, switched off, so the Rules screen has them to show.
 *
 * Screens use it like this: `(await getActionRunner()).sendDraft(draftId)`.
 */
export function getActionRunner(): Promise<ActionRunner> {
  if (!ready) {
    ready = (async () => {
      const store = await getStore();
      const known = new Set((await store.getRules()).map(rule => rule.id));
      for (const rule of BUILTIN_RULES) {
        if (!known.has(rule.id)) {
          await store.saveRule(rule);
        }
      }
      return createActionRunner({ bridge, model, store });
    })();
    ready.catch(() => {
      ready = null;
    });
  }
  return ready;
}
