import { quickFilter } from '../../core/filter';
import type { ExtractedRecord, Message, MiraRecord } from '../../core/types';
import { failedRecord, verifyRecord } from '../../core/verify';
import type { MessageContext, ModelService, NativeBridge } from '../contracts';
import type { Store, StoredItem } from '../db';
import { splitNotification } from './split';

export type IntakeStore = Pick<
  Store,
  'addMessage' | 'saveRecord' | 'getMessagesByStatus' | 'getItem'
>;

export interface IntakeDeps {
  bridge: Pick<NativeBridge, 'drainInbox'>;
  model: Pick<ModelService, 'extract'>;
  store: IntakeStore;
  /** Called after a message has been read by the model and stored, to apply the rules. */
  onProcessed?: (item: StoredItem) => Promise<void>;
}

const SUMMARY_MAX = 120;

/** The record for a message the quick filter settled without the model. */
function filteredRecord(
  message: Message,
  type: 'promotion' | 'chatter',
): MiraRecord {
  return {
    messageId: message.id,
    type,
    summary: message.text.slice(0, SUMMARY_MAX),
    needsUser: false,
    urgency: 'low',
    request: null,
    amount: null,
    dateText: null,
    dateAt: null,
    sensitive: false,
    instructionLike: false,
    duplicateOf: null,
  };
}

/**
 * Takes captured notifications to stored records (spec 4.3 and 6.1): drain
 * the inbox, split into messages, skip ones already stored, then quick
 * filter → model → verifier → storage. One run at a time; a call made while
 * a run is in progress makes it go round once more.
 */
export function createIntake({
  bridge,
  model,
  store,
  onProcessed,
}: IntakeDeps) {
  let running: Promise<void> | null = null;
  let again = false;

  async function takeIn(): Promise<void> {
    for (const notification of await bridge.drainInbox()) {
      for (const { message, chat } of splitNotification(notification)) {
        const route = quickFilter(notification, message.text);
        if (route === 'drop') {
          continue;
        }
        const added = await store.addMessage(message, chat);
        if (added && route !== 'model') {
          await store.saveRecord(filteredRecord(message, route), 'filtered');
        }
      }
    }
  }

  async function extractWithRetry(
    message: Message,
    context: MessageContext,
  ): Promise<ExtractedRecord | null> {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        return await model.extract(message, context);
      } catch {
        // Tried once more, then stored as "couldn't read".
      }
    }
    return null;
  }

  /** Every message still waiting, including ones left by an earlier session. */
  async function process(): Promise<void> {
    for (const message of await store.getMessagesByStatus('new')) {
      const item = await store.getItem(message.id);
      const extracted = await extractWithRetry(message, {
        chatTitle: item?.chat.title ?? message.sender,
        chatKind: item?.chat.kind ?? 'private',
      });
      if (extracted) {
        const record = verifyRecord(extracted, message);
        await store.saveRecord(record, 'processed');
        if (onProcessed && item) {
          // A failing rule or action must not stop the next message being read.
          await onProcessed({ ...item, record }).catch(() => {});
        }
      } else {
        await store.saveRecord(failedRecord(message.id), 'failed');
      }
    }
  }

  async function run(): Promise<void> {
    do {
      again = false;
      await takeIn();
      await process();
    } while (again);
  }

  return {
    /** Resolves when everything captured so far has been stored and processed. */
    drain(): Promise<void> {
      if (running) {
        again = true;
        return running;
      }
      running = run().finally(() => {
        running = null;
      });
      return running;
    },
  };
}
