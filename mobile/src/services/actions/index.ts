import { GONE_REASON, recheckQueued, reminderTime } from '../../core/queue';
import { decide } from '../../core/rules';
import type {
  Action,
  ActionKind,
  ActionStatus,
  Decision,
  Draft,
} from '../../core/types';
import type { ModelService, NativeBridge } from '../contracts';
import type { Store, StoredItem } from '../db';

export type ActionStore = Pick<
  Store,
  | 'getRules'
  | 'getChannels'
  | 'getActions'
  | 'getActionsBetween'
  | 'addAction'
  | 'updateAction'
  | 'addDraft'
  | 'updateDraft'
  | 'getDrafts'
  | 'getItem'
>;

export interface ActionDeps {
  bridge: Pick<
    NativeBridge,
    'sendReply' | 'scheduleReminder' | 'cancelReminder' | 'isOnline'
  >;
  model: Pick<ModelService, 'draftReply'>;
  store: ActionStore;
  now?: () => number;
}

export type SendOutcome = 'sent' | 'queued' | 'needs_you';

/** What came of the user asking for a draft. */
export type DraftRequest =
  | { outcome: 'drafted'; draftId: string }
  /** A draft for this message was already waiting; no second one was written. */
  | { outcome: 'exists'; draftId: string }
  | { outcome: 'blocked'; reason: string }
  | { outcome: 'failed' };

export const REPLIES_OFF_REASON =
  'Replies are off for this app. Turn on “Also draft replies” in Connected Apps.';
export const CANNOT_ANSWER_REASON = 'This message can’t be answered from MIRA.';
export const HOSTILE_REASON =
  'MIRA doesn’t write replies to messages like this one.';

const INSTRUCTION_REASON =
  'The message tries to give instructions, so nothing was done.';

function startOfDay(time: number): number {
  const date = new Date(time);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/**
 * Turns rule decisions into actions and carries them out (spec 4.9). Every
 * action is written to the log before it runs and updated with the result.
 * A reply is only ever sent from `sendDraft`, which the Approvals screen
 * calls after the user's tap and confirmation, or from `flushQueue` for a
 * reply the user already approved while offline.
 */
export function createActionRunner({
  bridge,
  model,
  store,
  now = Date.now,
}: ActionDeps) {
  let counter = 0;
  const sending = new Map<string, Promise<SendOutcome>>();
  const drafting = new Map<string, Promise<DraftRequest>>();
  let flushing: Promise<void> | null = null;
  const newId = (prefix: string) =>
    `${prefix}-${now().toString(36)}-${(counter++).toString(36)}`;

  async function log(
    kind: ActionKind,
    messageId: string,
    ruleId: string | null,
    status: ActionStatus,
    reason: string | null,
    payload: Record<string, string> = {},
  ): Promise<Action> {
    const action: Action = {
      id: newId('a'),
      ruleId,
      messageId,
      kind,
      payload,
      status,
      reason,
      createdAt: now(),
      doneAt: status === 'done' ? now() : null,
    };
    await store.addAction(action);
    return action;
  }

  /** Runs a step for an action already logged as queued, then records how it ended. */
  async function carryOut(
    action: Action,
    step: () => Promise<void>,
  ): Promise<void> {
    try {
      await step();
      await store.updateAction(action.id, { status: 'done', doneAt: now() });
    } catch (error) {
      await store.updateAction(action.id, {
        status: 'failed',
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async function runDecision(
    decision: Decision,
    item: StoredItem,
  ): Promise<void> {
    const { message, record } = item;
    if (!record) return;
    const { action: kind, ruleId } = decision;

    if (decision.outcome === 'blocked') {
      await log(kind, message.id, ruleId, 'blocked', decision.reason);
      return;
    }

    if (kind === 'calendar') {
      await log(
        kind,
        message.id,
        ruleId,
        'blocked',
        'Calendar entries are not part of this build.',
      );
      return;
    }

    if (kind === 'draft') {
      const action = await log(kind, message.id, ruleId, 'queued', null);
      await carryOut(action, async () => {
        const text = await model.draftReply(message, {
          chatTitle: item.chat.title,
          chatKind: item.chat.kind,
        });
        await store.addDraft({
          id: newId('d'),
          messageId: message.id,
          text,
          firstText: text,
          status: 'waiting',
        });
      });
      return;
    }

    if (kind === 'file') {
      await log(kind, message.id, ruleId, 'done', null);
      return;
    }

    // remind and alert are both local notifications.
    let at = now();
    let title = `Urgent: ${record.summary}`;
    if (kind === 'remind') {
      const time =
        record.dateAt === null ? null : reminderTime(record.dateAt, now());
      if (time === null) {
        const reason =
          record.dateAt === null
            ? 'No date was found to remind you about.'
            : 'The date has already passed.';
        await log(kind, message.id, ruleId, 'blocked', reason);
        return;
      }
      at = time;
      title = record.summary;
    }
    const payload = { title, at: String(at) };
    if (decision.outcome === 'prepare') {
      await log(
        kind,
        message.id,
        ruleId,
        'needs_you',
        decision.reason,
        payload,
      );
      return;
    }
    const action = await log(kind, message.id, ruleId, 'queued', null, payload);
    await carryOut(action, () => bridge.scheduleReminder(title, at));
  }

  async function findDraft(draftId: string): Promise<Draft | null> {
    for (const status of ['waiting', 'approved'] as const) {
      const found = (await store.getDrafts(status)).find(
        draft => draft.id === draftId,
      );
      if (found) return found;
    }
    return null;
  }

  /** Sends through the notification's reply box and records what happened. */
  async function deliver(
    action: Action,
    draft: Draft,
    item: StoredItem,
  ): Promise<SendOutcome> {
    const result = await bridge.sendReply(
      item.message.notificationKey,
      draft.text,
    );
    if (result === 'sent') {
      await store.updateDraft(draft.id, { status: 'sent' });
      await store.updateAction(action.id, { status: 'done', doneAt: now() });
      return 'sent';
    }
    await store.updateAction(action.id, {
      status: 'needs_you',
      reason: GONE_REASON,
    });
    return 'needs_you';
  }

  return {
    /**
     * Takes back what was done for a message that turned out to repeat an
     * earlier one: its waiting draft is discarded and its reminder cancelled,
     * unless the first message has the very same reminder.
     */
    async retract(copyId: string, originalId: string): Promise<void> {
      const reason =
        'This message repeats an earlier one, so this was taken back.';
      for (const draft of await store.getDrafts('waiting')) {
        if (draft.messageId === copyId) {
          await store.updateDraft(draft.id, { status: 'discarded' });
        }
      }
      const all = await store.getActions(Number.MAX_SAFE_INTEGER, 500);
      const sameReminder = (a: Action, b: Action) =>
        a.payload.title === b.payload.title && a.payload.at === b.payload.at;
      const kept = all.filter(
        a =>
          a.messageId === originalId &&
          a.status === 'done' &&
          a.payload.at !== undefined,
      );
      for (const action of all) {
        if (
          action.messageId !== copyId ||
          action.status !== 'done' ||
          action.kind === 'send'
        ) {
          continue;
        }
        const at = Number(action.payload.at);
        if (
          action.payload.title &&
          at > now() &&
          !kept.some(k => sameReminder(k, action))
        ) {
          await bridge.cancelReminder(action.payload.title, at);
        }
        await store.updateAction(action.id, {
          status: 'undone',
          reason,
          doneAt: now(),
        });
      }
    },

    /** Applies the user's rules to a message that has just been read. */
    async onRecord(item: StoredItem): Promise<void> {
      const { message, chat, record } = item;
      if (!record) return;

      const [rules, channels, today] = await Promise.all([
        store.getRules(),
        store.getChannels(),
        store.getActionsBetween(startOfDay(now()), now() + 1),
      ]);
      const channel = channels.find(c => c.packageName === message.packageName);
      if (!channel?.enabled) return;
      const actionsTodayByRule: Record<string, number> = {};
      let autoActionsToday = 0;
      for (const action of today) {
        if (!action.ruleId || action.status === 'blocked') continue;
        actionsTodayByRule[action.ruleId] =
          (actionsTodayByRule[action.ruleId] ?? 0) + 1;
        if (action.status === 'done' && action.kind !== 'draft')
          autoActionsToday += 1;
      }

      const decisions = decide({
        record,
        message,
        chat,
        rules,
        channelLevel: channel?.level ?? 1,
        autoActionsToday,
        actionsTodayByRule,
      });

      // The log says why nothing happened, even when no rule matched.
      if (record.instructionLike && decisions.length === 0) {
        await log('file', message.id, null, 'blocked', INSTRUCTION_REASON);
        return;
      }
      for (const decision of decisions) {
        await runDecision(decision, item);
      }
    },

    /**
     * Writes a draft because the user asked for one on this message. Being
     * asked lifts the limits on group chats and sensitive messages, which
     * only stop automatic drafts; the app's permission level and the block on
     * messages that give instructions still apply. The draft waits in
     * Approvals like any other: nothing is sent here.
     */
    draftFor(messageId: string): Promise<DraftRequest> {
      const active = drafting.get(messageId);
      if (active) return active;
      const work = (async (): Promise<DraftRequest> => {
        const item = await store.getItem(messageId);
        if (!item || !item.record) return { outcome: 'failed' };
        const { message, record } = item;

        const waiting = (await store.getDrafts('waiting')).find(
          draft => draft.messageId === messageId,
        );
        if (waiting) return { outcome: 'exists', draftId: waiting.id };

        const channel = (await store.getChannels()).find(
          c => c.packageName === message.packageName,
        );
        const refusal = record.instructionLike
          ? HOSTILE_REASON
          : !channel?.enabled || channel.level < 2
          ? REPLIES_OFF_REASON
          : !message.canReply
          ? CANNOT_ANSWER_REASON
          : null;
        if (refusal) {
          await log('draft', message.id, null, 'blocked', refusal);
          return { outcome: 'blocked', reason: refusal };
        }

        const action = await log('draft', message.id, null, 'queued', null);
        const draftId = newId('d');
        try {
          const text = await model.draftReply(message, {
            chatTitle: item.chat.title,
            chatKind: item.chat.kind,
          });
          await store.addDraft({
            id: draftId,
            messageId: message.id,
            text,
            firstText: text,
            status: 'waiting',
          });
          await store.updateAction(action.id, {
            status: 'done',
            doneAt: now(),
          });
          return { outcome: 'drafted', draftId };
        } catch (error) {
          await store.updateAction(action.id, {
            status: 'failed',
            reason: error instanceof Error ? error.message : String(error),
          });
          return { outcome: 'failed' };
        }
      })();
      drafting.set(messageId, work);
      const clear = () => {
        if (drafting.get(messageId) === work) drafting.delete(messageId);
      };
      work.then(clear, clear);
      return work;
    },

    /**
     * Sends a draft the user has just confirmed. Offline, it is kept as
     * queued and sent by `flushQueue` when the connection returns.
     */
    sendDraft(draftId: string): Promise<SendOutcome> {
      const active = sending.get(draftId);
      if (active) return active;
      const work = (async (): Promise<SendOutcome> => {
        const draft = (await store.getDrafts('waiting')).find(
          d => d.id === draftId,
        );
        const item = draft ? await store.getItem(draft.messageId) : null;
        if (!draft || !item) return 'needs_you';

        const channel = (await store.getChannels()).find(
          c => c.packageName === item.message.packageName,
        );
        if (!channel?.enabled || channel.level < 2 || !item.message.canReply) {
          await log(
            'send',
            item.message.id,
            null,
            'blocked',
            'This app no longer permits replies, or the message cannot be answered.',
            { draftId },
          );
          return 'needs_you';
        }

        await store.updateDraft(draft.id, { status: 'approved' });
        const approved: Draft = { ...draft, status: 'approved' };
        const payload = { draftId: draft.id };

        if (!(await bridge.isOnline())) {
          await log(
            'send',
            item.message.id,
            null,
            'queued',
            'Waiting for a connection.',
            payload,
          );
          return 'queued';
        }
        const action = await log(
          'send',
          item.message.id,
          null,
          'queued',
          null,
          payload,
        );
        try {
          return await deliver(action, approved, item);
        } catch {
          await store.updateAction(action.id, {
            status: 'needs_you',
            reason:
              'The reply could not be confirmed as sent. Review it before trying again.',
          });
          return 'needs_you';
        }
      })();
      sending.set(draftId, work);
      work.finally(() => sending.delete(draftId)).catch(() => undefined);
      return work;
    },

    /** Rechecks and sends every reply that was approved while offline. */
    flushQueue(): Promise<void> {
      if (flushing) return flushing;
      const work = (async () => {
        if (!(await bridge.isOnline())) return;
        const queued = (await store.getActions()).filter(
          action => action.kind === 'send' && action.status === 'queued',
        );
        if (queued.length === 0) return;
        for (const action of queued.reverse()) {
          if (!(await bridge.isOnline())) break;
          const channels = await store.getChannels();
          const draft = await findDraft(action.payload.draftId);
          const item = draft ? await store.getItem(draft.messageId) : null;
          const channel =
            channels.find(c => c.packageName === item?.message.packageName) ??
            null;
          const check = recheckQueued(draft, channel);
          if (check.outcome === 'needs_you' || !draft || !item) {
            await store.updateAction(action.id, {
              status: 'needs_you',
              reason:
                check.outcome === 'needs_you' ? check.reason : GONE_REASON,
            });
            continue;
          }
          try {
            await deliver(action, draft, item);
          } catch {
            await store.updateAction(action.id, {
              status: 'needs_you',
              reason:
                'The reply could not be confirmed as sent. Review it before trying again.',
            });
          }
        }
      })();
      flushing = work;
      work
        .finally(() => {
          flushing = null;
        })
        .catch(() => undefined);
      return work;
    },
  };
}

export type ActionRunner = ReturnType<typeof createActionRunner>;
