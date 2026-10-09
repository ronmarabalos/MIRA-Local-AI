import { ASK_WINDOW_MS, type AskMatch, searchMessages } from '../core/ask';
import type { ModelService } from './contracts';
import type { Store } from './db/store';

export interface AskDeps {
  store: Pick<Store, 'getItems'>;
  model: Pick<ModelService, 'answer'>;
  now?: () => number;
}

/** More than a phone holds in 14 days; a ceiling, not a page size. */
const MAX_ITEMS = 1000;

/**
 * Ask MIRA: find the matching messages first, then have the model explain
 * them. The two are separate so the sources can be shown before the model
 * has finished, and still stand when it fails.
 */
export function createAsk({ store, model, now = Date.now }: AskDeps) {
  return {
    async findSources(question: string): Promise<AskMatch[]> {
      const at = now();
      const items = await store.getItems(
        at - ASK_WINDOW_MS,
        // A day ahead as well: a message can carry a time slightly ahead of this phone's clock.
        at + 24 * 60 * 60 * 1000,
        MAX_ITEMS,
      );
      return searchMessages(question, items, at);
    },

    /** The model's answer, or null when it has none: the caller then shows "Here's what I found". */
    async explain(
      question: string,
      matches: AskMatch[],
    ): Promise<string | null> {
      if (matches.length === 0) return null;
      try {
        return await model.answer(
          question,
          matches.map(({ item }) => ({
            message: item.message,
            context: { chatTitle: item.chat.title, chatKind: item.chat.kind },
          })),
        );
      } catch {
        return null;
      }
    },
  };
}

export type Ask = ReturnType<typeof createAsk>;
