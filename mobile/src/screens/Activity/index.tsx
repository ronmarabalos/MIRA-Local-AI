import { useState } from 'react';
import { View } from 'react-native';
import { CollectionScreen } from '../../components/CollectionScreen';
import { SourceQuote } from '../../components/SourceQuote';
import { T } from '../../components/T';
import { BackButton, Glass, SecondaryButton } from '../../components/ui';
import { useQuery } from '../../services/db/hooks';
import { activityOverview } from '../../services/db/workflows';
import { useForegroundRetry } from '../../services/db/foreground';

const labels = {
  queued: 'Queued',
  done: 'Completed',
  failed: 'Failed',
  blocked: 'Blocked',
  needs_you: 'Needs you',
  undone: 'Undone',
};

export default function ActivityScreen() {
  const [limit, setLimit] = useState(50);
  const { data, error, retry } = useQuery(
    store => activityOverview(store, limit),
    [limit],
  );
  useForegroundRetry(retry);
  return (
    <CollectionScreen
      rows={data?.rows ?? []}
      keyFor={({ action }) => action.id}
      header={
        <>
          <BackButton to="Profile" />
          <T accessibilityRole="header" className="text-30 font-medium">
            Activity
          </T>
          <T className="text-15 text-ink-2">
            Every action and its result, stored on this phone.
          </T>
          {!data && !error ? <T>Loading activity...</T> : null}
          {error ? (
            <>
              <T>Could not load activity.</T>
              <SecondaryButton label="Retry activity" onPress={retry} />
            </>
          ) : null}
          {data?.rows.length === 0 ? (
            <T>
              No activity yet. Actions and blocked messages will appear here.
            </T>
          ) : null}
        </>
      }
      row={({ action, item, rule, appLabel }) => (
        <Glass className="gap-10 rounded-20 p-14">
          <View className="gap-4">
            <T className="text-17 font-semibold">
              {action.kind === 'send'
                ? 'Reply'
                : action.kind === 'remind'
                ? 'Reminder'
                : action.kind === 'draft'
                ? 'Reply draft'
                : action.kind === 'alert'
                ? 'Urgent alert'
                : action.kind}
            </T>
            <T className="text-14 font-semibold">{labels[action.status]}</T>
            <T className="text-12 text-ink-2">
              {new Date(action.createdAt).toLocaleString()}
            </T>
          </View>
          <T className="text-14 text-ink-body">{rule}</T>
          {action.reason ? (
            <T className="text-14 text-ink-body">{action.reason}</T>
          ) : null}
          {item ? (
            <SourceQuote item={item} appLabel={appLabel} expandable />
          ) : (
            <T>Original message is no longer available.</T>
          )}
        </Glass>
      )}
      footer={
        data?.hasMore ? (
          <SecondaryButton
            label="Load more activity"
            onPress={() => setLimit(n => n + 50)}
          />
        ) : null
      }
    />
  );
}
