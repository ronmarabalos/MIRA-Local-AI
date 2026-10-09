import { DUPLICATE_WINDOW_MS, findDuplicate } from '../../core/dedupe';
import { quickFilter } from '../../core/filter';
import type { ExtractedRecord, Message, MiraRecord } from '../../core/types';
import { failedRecord, verifyRecord } from '../../core/verify';
import type { MessageContext, ModelService, NativeBridge } from '../contracts';
import type { Store, StoredItem } from '../db';
import { splitNotification } from './split';

export type IntakeStore = Pick<
  Store,
  | 'addMessage'
  | 'saveRecord'
  | 'getMessagesByStatus'
  | 'getItem'
  | 'getItems'
  | 'getChannels'
  | 'saveProcessingTime'
>;

export interface IntakeDeps {
  bridge: Pick<NativeBridge, 'drainInbox'>;
  model: Pick<ModelService, 'extract'>;
  store: IntakeStore;
  /** Called after a message has been read by the model and stored, to apply the rules. */
  onProcessed?: (item: StoredItem) => Promise<void>;
  /** Called when an already stored message is found to repeat an earlier one. */
  onDuplicateLinked?: (copyId: string, originalId: string) => Promise<void>;
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
  onDuplicateLinked,
}: IntakeDeps) {
  let running: Promise<void> | null = null;
  let again = false;
  let relinked = false;

  async function takeIn(): Promise<void> {
    for (const notification of await bridge.drainInbox()) {
      const channels = await store.getChannels();
      if (
        !channels.some(
          c => c.packageName === notification.packageName && c.enabled,
        )
      )
        continue;
      for (const { message, chat } of splitNotification(notification)) {
        const started = Date.now();
        const route = quickFilter(notification, message.text);
        if (route === 'drop') {
          continue;
        }
        const added = await store.addMessage(message, chat);
        if (added && route !== 'model') {
          await store.saveRecord(filteredRecord(message, route), 'filtered');
          await store.saveProcessingTime(
            message.id,
            Math.max(0, Date.now() - started),
          );
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
      const channels = await store.getChannels();
      if (
        !channels.some(c => c.packageName === message.packageName && c.enabled)
      )
        continue;
      // A repeat of a message already read takes that message's record: no
      // second model call, no second reminder or draft, and one report line.
      const earlier = await store.getItems(
        message.postedAt - DUPLICATE_WINDOW_MS,
        message.postedAt + 1,
      );
      const originalId = findDuplicate(message, earlier);
      const original = earlier.find(e => e.message.id === originalId)?.record;
      if (originalId && original) {
        await store.saveRecord(
          { ...original, messageId: message.id, duplicateOf: originalId },
          'processed',
        );
        continue;
      }
      const item = await store.getItem(message.id);
      const started = Date.now();
      const extracted = await extractWithRetry(message, {
        chatTitle: item?.chat.title ?? message.sender,
        chatKind: item?.chat.kind ?? 'private',
      });
      if (extracted) {
        const record = verifyRecord(extracted, message);
        await store.saveRecord(record, 'processed');
        await store.saveProcessingTime(
          message.id,
          Math.max(0, Date.now() - started),
        );
        if (onProcessed && item) {
          // A failing rule or action must not stop the next message being read.
          await onProcessed({ ...item, record }).catch(() => {});
        }
      } else {
        await store.saveRecord(failedRecord(message.id), 'failed');
      }
    }
  }

  /**
   * Links copies that were stored before duplicates were recognised, so a
   * message that already appears twice becomes one report line. Runs once.
   */
  async function relinkStored(): Promise<void> {
    const now = Date.now();
    const recent = (
      await store.getItems(now - DUPLICATE_WINDOW_MS, now + 1)
    ).sort((a, b) => a.message.postedAt - b.message.postedAt);
    for (const item of recent) {
      const { message, record } = item;
      if (!record || message.status !== 'processed') {
        continue;
      }
      if (record.duplicateOf !== null) {
        // Linked by an earlier version, before its draft or reminder was taken back.
        if (onDuplicateLinked) {
          await onDuplicateLinked(message.id, record.duplicateOf).catch(
            () => {},
          );
        }
        continue;
      }
      const originalId = findDuplicate(message, recent);
      if (originalId) {
        record.duplicateOf = originalId;
        await store.saveRecord(record, 'processed');
        if (onDuplicateLinked) {
          await onDuplicateLinked(message.id, originalId).catch(() => {});
        }
      }
    }
  }

  async function run(): Promise<void> {
    if (!relinked) {
      relinked = true;
      await relinkStored().catch(() => {});
    }
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
