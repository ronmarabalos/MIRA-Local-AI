/** The built-in rules as short, switchable helpers (boards 07 and 12). */
import { useRef, useState } from 'react';
import { View } from 'react-native';

import { Companion } from './Companion';
import { Icon, type IconName } from './Icon';
import { useGo } from './nav';
import { T } from './T';
import { Glass, IconTile, SecondaryButton, Switch, Tap } from './ui';
import { getStore } from '../services/db';
import { useForegroundRetry } from '../services/db/foreground';
import { useQuery } from '../services/db/hooks';
import { ruleOverview } from '../services/db/workflows';
import { fx } from '../theme/effects';
import palette from '../theme/palette';

/** Short names for the built-in rules; a rule not listed shows its sentence. */
const LOOK: Record<string, { title: string; line: string; icon: IconName; fg: string; bg: string }> = {
  'builtin-remind': {
    title: 'Due date reminders',
    line: 'Reminds you about deadlines and payments.',
    icon: 'bell',
    fg: palette.warning.ink,
    bg: palette.warning.bg,
  },
  'builtin-draft': {
    title: 'Reply drafts',
    line: 'Writes replies to private questions for you to check.',
    icon: 'pencil',
    fg: palette.navy.DEFAULT,
    bg: palette.peri.tonal,
  },
  'builtin-alert': {
    title: 'Urgent alerts',
    line: 'Tells you right away when something is urgent.',
    icon: 'bolt',
    fg: palette.error.ink,
    bg: palette.error.bg,
  },
};

export function RulesPanel({ summary = false }: { summary?: boolean }) {
  const { data, error, retry } = useQuery(ruleOverview, []);
  useForegroundRetry(retry);
  const go = useGo();
  const busy = useRef(false);
  const [notice, setNotice] = useState('');
  const rules = data?.rules ?? [];
  const on = rules.filter(r => r.rule.enabled).length;

  const toggle = async (id: string, enabled: boolean) => {
    if (busy.current) return;
    busy.current = true;
    try {
      await (await getStore()).setRuleEnabled(id, !enabled);
      setNotice('');
    } catch {
      setNotice("Couldn't save that. Try again.");
    } finally {
      busy.current = false;
    }
  };

  return (
    <View className="gap-16">
      {summary && data ? (
        <View className="flex-row items-center gap-14 rounded-24 bg-ink p-18" style={fx.darkCard}>
          <Companion size={56} theme="dark" />
          <View className="flex-1 gap-4">
            <T className="text-18 font-bold text-dk-text">
              {on === 0 ? 'No helpers on yet' : `${on} of ${rules.length} helpers on`}
            </T>
          </View>
        </View>
      ) : null}

      {!data && !error ? <T className="text-14 text-ink-2">Loading…</T> : null}
      {error ? (
        <View className="gap-10">
          <T className="text-14 text-ink-2">Couldn't load your helpers.</T>
          <SecondaryButton label="Try again" onPress={retry} />
        </View>
      ) : null}
      {notice ? (
        <T accessibilityRole="alert" className="text-14 font-semibold text-error-ink">
          {notice}
        </T>
      ) : null}

      {rules.length > 0 ? (
        <Glass className="rounded-22 px-16 py-4">
          {rules.map(({ rule, count }, i) => {
            const look = LOOK[rule.id];
            return (
              <Tap
                key={rule.id}
                label={`${rule.enabled ? 'Disable' : 'Enable'} ${rule.sentence}`}
                accessibilityRole="switch"
                accessibilityState={{ checked: rule.enabled }}
                onPress={() => toggle(rule.id, rule.enabled)}
                className={`min-h-72 flex-row items-center gap-12 py-12 ${
                  i < rules.length - 1 ? 'border-b border-ink/8' : ''
                }`}
              >
                <IconTile
                  name={look?.icon ?? 'bulb'}
                  fg={look?.fg ?? palette.navy.DEFAULT}
                  bg={look?.bg ?? palette.peri.tonal}
                />
                <View className="flex-1 gap-2">
                  <T className="text-15 font-bold">{look?.title ?? rule.sentence}</T>
                  {look ? <T className="text-13 leading-[18px] text-ink-2">{look.line}</T> : null}
                  {count > 0 ? (
                    <T className="text-12 text-ink-muted">
                      {`Matches ${count} recent message${count === 1 ? '' : 's'}`}
                    </T>
                  ) : null}
                </View>
                <Switch on={rule.enabled} />
              </Tap>
            );
          })}
        </Glass>
      ) : null}
      {data && rules.length === 0 ? <T className="text-14 text-ink-2">No helpers yet.</T> : null}

      <View className="flex-row items-center gap-8 px-4">
        <Icon name="shieldCheck" size={18} color={palette.success.ink} />
        <T className="flex-1 text-13 font-semibold text-ink-2">MIRA never sends a reply without your OK.</T>
      </View>

      <View className="flex-row gap-10">
        <Tap label="Review drafts" onPress={() => go('Approvals')} glass="glass2" className="flex-1 gap-8 rounded-20 p-14">
          <Icon name="pencil" size={20} color={palette.navy.DEFAULT} />
          <T className="text-14 font-bold">Drafts</T>
        </Tap>
        <Tap label="View activity" onPress={() => go('Activity')} glass="glass2" className="flex-1 gap-8 rounded-20 p-14">
          <Icon name="history" size={20} color={palette.navy.DEFAULT} />
          <T className="text-14 font-bold">Activity</T>
        </Tap>
      </View>
    </View>
  );
}
