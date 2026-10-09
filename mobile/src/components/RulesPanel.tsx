import { useRef, useState } from 'react';
import { View } from 'react-native';
import { T } from './T';
import { Glass, SecondaryButton, Switch, Tap } from './ui';
import { getStore } from '../services/db';
import { useQuery } from '../services/db/hooks';
import { ruleOverview } from '../services/db/workflows';
import { useForegroundRetry } from '../services/db/foreground';

export function RulesPanel() {
  const { data, error, retry } = useQuery(ruleOverview, []);
  useForegroundRetry(retry);
  const busy = useRef(false);
  const [notice, setNotice] = useState('');
  return (
    <View className="gap-14">
      <T className="text-14 text-ink-2">
        Rules start off. Switch on only the help you want. Replies are prepared
        for your approval, never sent automatically.
      </T>
      {!data && !error ? <T>Loading rules...</T> : null}
      {error ? (
        <>
          <T>Could not load rules. Try again.</T>
          <SecondaryButton label="Retry rules" onPress={retry} />
        </>
      ) : null}
      {notice ? <T accessibilityRole="alert">{notice}</T> : null}
      {data?.partial ? (
        <T>Preview uses the latest 200 stored messages.</T>
      ) : null}
      {data?.rules.map(({ rule, count }) => (
        <Glass key={rule.id} className="gap-8 rounded-20 p-14">
          <Tap
            label={`${rule.enabled ? 'Disable' : 'Enable'} ${rule.sentence}`}
            accessibilityRole="switch"
            accessibilityState={{ checked: rule.enabled }}
            onPress={async () => {
              if (busy.current) return;
              busy.current = true;
              try {
                await (await getStore()).setRuleEnabled(rule.id, !rule.enabled);
                setNotice('');
              } catch {
                setNotice('Could not save this rule. Try the switch again.');
              } finally {
                busy.current = false;
              }
            }}
            className="min-h-58 flex-row items-center gap-12"
          >
            <View className="flex-1 gap-6">
              <T className="text-16 font-semibold">{rule.sentence}</T>
              <T className="text-13 text-ink-2">
                {rule.enabled ? 'On' : 'Off'} - Daily limit{' '}
                {rule.definition.limits.daily_cap}
              </T>
            </View>
            <Switch on={rule.enabled} />
          </Tap>
          <T className="text-14 text-ink-body">{`${count} stored message${
            count === 1 ? '' : 's'
          } would qualify. Preview only; nothing has been done.`}</T>
        </Glass>
      ))}
      {data?.rules.length === 0 ? <T>No rules available.</T> : null}
    </View>
  );
}
