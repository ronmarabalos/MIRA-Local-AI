import { T } from './T';
import { Glass, SecondaryButton } from './ui';
import { bridge } from '../services';
import { startOfDay, useQuery } from '../services/db/hooks';
import { useForegroundRetry } from '../services/db/foreground';

export function PrivacyProof() {
  const { data, error, retry } = useQuery(async store => {
    const from = startOfDay(Date.now());
    const next = new Date(from);
    next.setDate(next.getDate() + 1);
    const [facts, stats] = await Promise.all([
      bridge.getProofFacts(),
      store.getProcessingStats(from, next.getTime()),
    ]);
    return { facts, ...stats };
  }, []);
  useForegroundRetry(retry);
  return (
    <Glass className="gap-10 rounded-20 p-14">
      <T accessibilityRole="header" className="text-20 font-semibold">
        Privacy proof
      </T>
      {!data && !error ? <T>Reading system facts?</T> : null}
      {error ? (
        <>
          <T>Could not read privacy facts.</T>
          <SecondaryButton label="Retry privacy facts" onPress={retry} />
        </>
      ) : null}
      {data ? (
        <>
          <T className="text-14 font-semibold">
            {data.facts.hasInternetPermission
              ? data.facts.isDebugBuild
                ? 'Development build: internet permission present.'
                : 'Internet permission is present in this build.'
              : 'This build has no internet permission.'}
          </T>
          <T className="text-14 text-ink-body">
            {data.facts.bytesSent === null
              ? 'Bytes sent: Android did not provide this number.'
              : `${data.facts.bytesSent} bytes sent (system counter).`}
          </T>
          <T className="text-14 text-ink-body">{`${data.processed} message${
            data.processed === 1 ? '' : 's'
          } processed today`}</T>
          <T className="text-14 text-ink-body">
            {data.averageMs === null
              ? 'Average processing time: no timed messages yet.'
              : `Average processing time: ${(data.averageMs / 1000).toFixed(
                  2,
                )} seconds across ${
                  data.samples
                } timed messages (reading and filtering).`}
          </T>
        </>
      ) : null}
      <SecondaryButton label="Refresh privacy facts" onPress={retry} />
    </Glass>
  );
}
