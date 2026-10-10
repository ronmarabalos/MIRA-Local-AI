import { useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { DraftCard, type ApprovalRow } from '../../components/DraftCard';
import { Dialog } from '../../components/Overlay';
import { CollectionScreen } from '../../components/CollectionScreen';
import { T } from '../../components/T';
import { BackButton, SecondaryButton } from '../../components/ui';
import { getStore } from '../../services/db';
import { useQuery } from '../../services/db/hooks';
import { approvalOverview } from '../../services/db/workflows';
import { getActionRunner } from '../../services/actions/runner';
import { useForegroundRetry } from '../../services/db/foreground';

export default function ApprovalsScreen() {
  const { data, error, retry } = useQuery(approvalOverview, []);
  useForegroundRetry(retry);
  const [candidate, setCandidate] = useState<{
    row: ApprovalRow;
    text: string;
  } | null>(null);
  const [notice, setNotice] = useState('');
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  async function confirm() {
    if (!candidate || locked.current) return;
    locked.current = true;
    setBusy(true);
    try {
      const store = await getStore();
      const current = (await store.getDrafts('waiting')).find(
        d => d.id === candidate.row.draft.id,
      );
      if (!current) {
        setNotice('This draft is no longer waiting for approval.');
        return;
      }
      await store.updateDraft(current.id, { text: candidate.text.trim() });
      const result = await (await getActionRunner()).sendDraft(current.id);
      setNotice(
        result === 'sent'
          ? 'Reply sent.'
          : result === 'queued'
          ? 'Queued - your approved reply will be rechecked when connected.'
          : 'This reply needs your review. Check its status below.',
      );
      setCandidate(null);
    } catch {
      setNotice(
        'Could not complete this reply. Check Activity before trying again.',
      );
    } finally {
      locked.current = false;
      setBusy(false);
      retry();
    }
  }
  async function discard(id: string) {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    try {
      await (await getStore()).updateDraft(id, { status: 'discarded' });
      setNotice('Draft discarded.');
    } catch {
      setNotice('Could not discard this draft. Try again.');
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  return (
    <>
      <CollectionScreen
        rows={data ?? []}
        keyFor={row => row.draft.id}
        header={
          <>
            <BackButton to="Home" />
            <T accessibilityRole="header" className="text-30 font-medium">
              Needs Your Approval
            </T>
            {!data && !error ? <T>Loading drafts...</T> : null}
            {error ? (
              <>
                <T>Could not load drafts.</T>
                <SecondaryButton label="Retry drafts" onPress={retry} />
              </>
            ) : null}
            {notice ? <T accessibilityRole="alert">{notice}</T> : null}
            {data?.length === 0 ? (
              <T>
                No drafts waiting.
              </T>
            ) : null}
          </>
        }
        // CollectionScreen invokes this item renderer; it is not mounted as a component type.
        // eslint-disable-next-line react/no-unstable-nested-components
        row={row => (
          <DraftCard
            row={row}
            text={edits[row.draft.id] ?? row.draft.text}
            onEdit={text =>
              setEdits(current => ({ ...current, [row.draft.id]: text }))
            }
            busy={busy}
            onSend={(r, text) => setCandidate({ row: r, text })}
            onDiscard={discard}
          />
        )}
      />
      <Dialog
        visible={!!candidate}
        onClose={() => {
          if (!locked.current) setCandidate(null);
        }}
        label="Confirm reply"
      >
        <T className="text-20 font-semibold">Send this reply?</T>
        <T className="text-14 text-ink-body">
          {candidate?.row.item
            ? `To ${candidate.row.item.message.sender} in ${candidate.row.item.chat.title}. Offline replies are queued until a connection returns.`
            : ''}
        </T>
        <ScrollView className="max-h-240">
          <T className="text-15 text-ink-body">{candidate?.text}</T>
        </ScrollView>
        <View className="gap-8">
          <SecondaryButton
            label="Confirm send"
            disabled={busy}
            onPress={confirm}
          />
          <SecondaryButton
            label="Cancel send"
            disabled={busy}
            onPress={() => setCandidate(null)}
          />
        </View>
      </Dialog>
    </>
  );
}
