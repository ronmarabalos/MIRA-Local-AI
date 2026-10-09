import { View } from 'react-native';
import type { approvalOverview } from '../services/db/workflows';
import { SourceQuote } from './SourceQuote';
import { T } from './T';
import { Field, Glass, SecondaryButton } from './ui';

export type ApprovalRow = Awaited<ReturnType<typeof approvalOverview>>[number];
export function DraftCard({
  row,
  text,
  onEdit,
  busy,
  onSend,
  onDiscard,
}: {
  row: ApprovalRow;
  text: string;
  onEdit(text: string): void;
  busy: boolean;
  onSend(row: ApprovalRow, text: string): void;
  onDiscard(id: string): void;
}) {
  const { draft, item, send, appLabel, why } = row;
  const waiting = draft.status === 'waiting';
  return (
    <Glass className="gap-12 rounded-20 p-14">
      <T className="text-17 font-semibold">
        {item
          ? `Reply to ${item.message.sender}`
          : 'Original message unavailable'}
      </T>
      {item ? <SourceQuote item={item} appLabel={appLabel} expandable /> : null}
      <T className="text-14 text-ink-body">Why: {why}</T>
      <T className="text-12 font-semibold text-ink-2">
        MIRA draft · review before sending
      </T>
      <Field
        accessibilityLabel={`Reply text ${draft.id}`}
        multiline
        value={text}
        onChangeText={onEdit}
        editable={waiting && !busy}
        className="min-h-100 text-15 leading-[23px]"
      />
      {send ? (
        <T className="text-14 font-semibold">
          {send.status === 'queued'
            ? 'Queued · waiting for a connection'
            : send.status === 'needs_you'
            ? 'Needs you'
            : send.status === 'blocked'
            ? 'Blocked'
            : send.status === 'done'
            ? 'Sent'
            : 'Could not send'}
        </T>
      ) : null}
      {send?.reason ? (
        <T className="text-14 text-ink-body">{send.reason}</T>
      ) : null}
      <View className="gap-8">
        {waiting && item ? (
          <SecondaryButton
            label="Send reply"
            disabled={busy || !text.trim()}
            onPress={() => onSend(row, text)}
          />
        ) : null}
        <SecondaryButton
          label="Discard draft"
          disabled={busy}
          onPress={() => onDiscard(draft.id)}
        />
      </View>
    </Glass>
  );
}
