import {
  ASK_WINDOW_MS,
  type AskMatch,
  recentHighlights,
  searchMessages,
} from '../core/ask';
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
 * Ask MIRA: find the messages first, then have the model sum them up into
 * an answer. The two are separate so the sources can be shown before the model
 * has finished, and still stand when it fails.
 */
export function createAsk({ store, model, now = Date.now }: AskDeps) {
  return {
    /**
     * The messages to answer from. `exact` is false when no keyword matched
     * and these are the messages that most need the user instead, for broad
     * questions such as "what do I need to do?".
     */
    async findSources(
      question: string,
    ): Promise<{ matches: AskMatch[]; exact: boolean }> {
      const at = now();
      const items = await store.getItems(
        at - ASK_WINDOW_MS,
        // A day ahead as well: a message can carry a time slightly ahead of this phone's clock.
        at + 24 * 60 * 60 * 1000,
        MAX_ITEMS,
      );
      const matches = searchMessages(question, items, at);
      return matches.length > 0
        ? { matches, exact: true }
        : { matches: recentHighlights(items, at), exact: false };
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
            record: item.record,
          })),
        );
      } catch {
        return null;
      }
    },
  };
}

export type Ask = ReturnType<typeof createAsk>;
