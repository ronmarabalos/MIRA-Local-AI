import { decide } from '../../core/rules';
import type { Action, Draft } from '../../core/types';
import type { Store } from './store';
import { getActionRunner } from '../actions/runner';

export async function ruleOverview(store: Store) {
  await getActionRunner();
  const [rules, channels, items] = await Promise.all([
    store.getRules(),
    store.getChannels(),
    store.getItems(0, Date.now() + 1, 201),
  ]);
  return {
    partial: items.length > 200,
    rules: rules.map(rule => ({
      rule,
      count: items.slice(0, 200).filter(item => {
        const channel = channels.find(
          c => c.packageName === item.message.packageName,
        );
        if (
          !item.record ||
          !channel?.enabled ||
          item.message.status === 'failed'
        )
          return false;
        return decide({
          record: item.record,
          message: item.message,
          chat: item.chat,
          rules: [{ ...rule, enabled: true }],
          channelLevel: channel.level,
          autoActionsToday: 0,
          actionsTodayByRule: {},
        }).some(d => d.outcome !== 'blocked');
      }).length,
    })),
  };
}

export async function approvalOverview(store: Store) {
  const [waiting, approved, actions, rules, channels] = await Promise.all([
    store.getDrafts('waiting'),
    store.getDrafts('approved'),
    store.getActions(undefined, 1000),
    store.getRules(),
    store.getChannels(),
  ]);
  return Promise.all(
    [...waiting, ...approved].map(async (draft: Draft) => {
      const item = await store.getItem(draft.messageId);
      const preparation = actions.find(
        a => a.kind === 'draft' && a.messageId === draft.messageId,
      );
      const send = actions.find(
        a => a.kind === 'send' && a.payload.draftId === draft.id,
      );
      return {
        draft,
        item,
        send,
        why:
          rules.find(r => r.id === preparation?.ruleId)?.sentence ??
          'Prepared for you to review. Nothing is sent without confirmation.',
        appLabel: channels.find(
          c => c.packageName === item?.message.packageName,
        )?.label,
      };
    }),
  );
}

export async function activityOverview(store: Store, limit: number) {
  const [actions, rules, channels] = await Promise.all([
    store.getActions(undefined, limit + 1),
    store.getRules(),
    store.getChannels(),
  ]);
  return {
    hasMore: actions.length > limit,
    rows: await Promise.all(
      actions.slice(0, limit).map(async (action: Action) => {
        const item = await store.getItem(action.messageId);
        return {
          action,
          item,
          rule:
            rules.find(r => r.id === action.ruleId)?.sentence ??
            (action.ruleId
              ? 'Previous rule'
              : action.kind === 'send'
              ? 'You confirmed this reply'
              : 'Safety check'),
          appLabel: channels.find(
            c => c.packageName === item?.message.packageName,
          )?.label,
        };
      }),
    ),
  };
}
