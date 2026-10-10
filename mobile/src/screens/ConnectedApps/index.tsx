/**
 * Board 19: the apps MIRA reads. Only connected apps and suggested message
 * apps are listed; any other app is found with Add an app.
 */
import { useRef, useState } from 'react';
import { View } from 'react-native';
import { useRoute, type RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../navigation';
import { CollectionScreen } from '../../components/CollectionScreen';
import { Steps } from '../../components/Steps';
import { useGo } from '../../components/nav';
import { T } from '../../components/T';
import { Icon } from '../../components/Icon';
import {
  BackButton,
  Field,
  Glass,
  PrimaryButton,
  SecondaryButton,
  Switch,
  Tap,
} from '../../components/ui';
import type { Channel } from '../../core/types';
import { bridge } from '../../services';
import { isMessageApp } from '../../services/channels';
import { getChannelManager } from '../../services/channels/manager';
import palette from '../../theme/palette';
import { useQuery } from '../../services/db/hooks';
import { useForegroundRetry } from '../../services/db/foreground';

export default function ConnectedAppsScreen() {
  const firstRun =
    useRoute<RouteProp<RootStackParamList, 'ConnectedApps'>>().params
      ?.firstRun ?? false;
  const go = useGo();
  const { data, error, retry } = useQuery(async () => {
    const manager = await getChannelManager();
    const [channels, listener] = await Promise.all([
      manager.discover(),
      bridge.isListenerEnabled(),
    ]);
    return { channels, listener };
  }, []);
  useForegroundRetry(retry);
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<Channel | null>(null);
  const [notice, setNotice] = useState('');
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState('');
  const all = data?.channels ?? [];
  // Connected apps, then message apps worth suggesting; the rest wait behind Add an app.
  const listed = all.filter(c => c.enabled || isMessageApp(c.packageName));
  const q = query.trim().toLowerCase();
  const others = all
    .filter(
      c =>
        !listed.includes(c) && (q === '' || c.label.toLowerCase().includes(q)),
    )
    .slice(0, 25);
  async function save(channel: Channel) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setNotice('');
    try {
      await (await getChannelManager()).save(channel);
      setFailed(null);
      retry();
    } catch {
      setFailed(channel);
      setNotice('Could not save. Try again.');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  return (
    <CollectionScreen
      rows={listed}
      keyFor={channel => channel.packageName}
      header={
        <>
          {firstRun ? (
            <View className="gap-10">
              <View className="flex-row items-center justify-between">
                <BackButton to="ModelSetup" look="plain" />
                <T className="text-13 font-semibold text-ink-2">Step 3 of 3</T>
              </View>
              <Steps done={3} />
            </View>
          ) : (
            <BackButton to="Profile" label="Back to Profile" />
          )}
          <T accessibilityRole="header" className="text-30 font-medium">
            Connected Apps
          </T>
          {!data && !error ? <T>Loading apps...</T> : null}
          {error ? (
            <>
              <T>Could not load apps. Try again.</T>
              <SecondaryButton label="Retry apps" onPress={retry} />
            </>
          ) : null}
          {data && !data.listener ? (
            <Glass className="gap-10 p-14 rounded-20">
              <T>
                Notification access is off.
              </T>
              <SecondaryButton
                label="Open notification settings"
                onPress={async () => {
                  try {
                    await bridge.openListenerSettings();
                  } catch {
                    setNotice('Could not open settings. Try again.');
                  }
                }}
              />
              <SecondaryButton
                label="Check notification access"
                onPress={retry}
              />
            </Glass>
          ) : null}
          {notice ? <T accessibilityRole="alert">{notice}</T> : null}
          {failed ? (
            <SecondaryButton
              label="Retry change"
              onPress={() => save(failed)}
            />
          ) : null}
          {data && listed.length === 0 ? (
            <T className="text-14 text-ink-2">
              No apps yet.
            </T>
          ) : null}
        </>
      }
      // CollectionScreen invokes this item renderer; it is not mounted as a component type.
      // eslint-disable-next-line react/no-unstable-nested-components
      row={channel => (
        <Glass key={channel.packageName} className="gap-10 rounded-20 p-14">
          <Tap
            label={`Read ${channel.label}`}
            accessibilityRole="switch"
            accessibilityState={{ checked: channel.enabled, disabled: busy }}
            disabled={busy}
            onPress={() => save({ ...channel, enabled: !channel.enabled })}
            className="min-h-58 flex-row gap-12 items-center"
          >
            <View className="flex-1 gap-4">
              <T className="text-17 font-bold">{channel.label}</T>
              {channel.enabled ? (
                <T className="text-13 text-success-ink">Connected</T>
              ) : (
                <View className="self-start rounded-full bg-mint-bg px-8 py-2">
                  <T className="text-11 font-bold text-mint-ink">Suggested</T>
                </View>
              )}
            </View>
            <Switch on={channel.enabled} />
          </Tap>
          {channel.enabled ? (
            <View
              accessibilityRole="radiogroup"
              accessibilityLabel={`Permissions for ${channel.label}`}
              className="gap-8"
            >
              {([1, 2] as const).map(level => (
                <Tap
                  key={level}
                  label={`${
                    level === 1 ? 'Read and report' : 'Also draft replies'
                  } for ${channel.label}`}
                  accessibilityRole="radio"
                  accessibilityState={{
                    checked: channel.level === level,
                    disabled: busy || !channel.enabled,
                  }}
                  disabled={busy || !channel.enabled}
                  onPress={() => save({ ...channel, level })}
                  className={`min-h-48 justify-center rounded-14 px-12 py-10 ${
                    channel.level === level ? 'bg-peri-tonal' : 'bg-white/60'
                  }`}
                >
                  <T className="text-14 font-semibold">
                    {level === 1 ? 'Read and report' : 'Also draft replies'}
                    {channel.level === level ? ' - selected' : ''}
                  </T>
                </Tap>
              ))}
            </View>
          ) : null}
        </Glass>
      )}
      footer={
        <>
          {adding ? (
            <Glass className="gap-10 rounded-20 p-14">
              <Field
                accessibilityLabel="Search apps"
                value={query}
                onChangeText={setQuery}
                placeholder="Search your apps"
                autoFocus
                className="h-48 rounded-14 border border-white/80 bg-white/60 px-14 text-15"
              />
              {others.length === 0 ? (
                <T className="text-14 text-ink-2">
                  {q
                    ? 'No app by that name.'
                    : 'Every app is already listed above.'}
                </T>
              ) : (
                others.map(app => (
                  <Tap
                    key={app.packageName}
                    label={`Connect ${app.label}`}
                    disabled={busy}
                    onPress={() => save({ ...app, enabled: true })}
                    className="min-h-48 flex-row items-center gap-10 border-b border-ink/8 py-8"
                  >
                    <T className="flex-1 text-15 font-semibold">{app.label}</T>
                    <Icon name="plus" size={16} color={palette.navy.DEFAULT} />
                    <T className="text-14 font-bold text-navy">Connect</T>
                  </Tap>
                ))
              )}
              <SecondaryButton
                label="Done adding"
                onPress={() => {
                  setAdding(false);
                  setQuery('');
                }}
              />
            </Glass>
          ) : (
            <SecondaryButton
              label="Add an app"
              onPress={() => setAdding(true)}
              left={<Icon name="plus" size={18} color={palette.ink.DEFAULT} />}
            />
          )}
          <SecondaryButton label="Refresh apps" onPress={retry} />
          {firstRun ? (
            <PrimaryButton
              label="Continue to Today"
              onPress={() => go('Home', { reset: true })}
            />
          ) : null}
        </>
      }
    />
  );
}
