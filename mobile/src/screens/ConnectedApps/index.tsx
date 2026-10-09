/** Board 19: notification sources, stored permissions, and native capture. */
import { useRef, useState } from 'react';
import { View } from 'react-native';
import { CollectionScreen } from '../../components/CollectionScreen';
import { T } from '../../components/T';
import {
  BackButton,
  Glass,
  SecondaryButton,
  Switch,
  Tap,
} from '../../components/ui';
import type { Channel } from '../../core/types';
import { bridge } from '../../services';
import { getChannelManager } from '../../services/channels/manager';
import { useQuery } from '../../services/db/hooks';
import { useForegroundRetry } from '../../services/db/foreground';

export default function ConnectedAppsScreen() {
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
      setNotice('Could not save this app permission. Try again.');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  return (
    <CollectionScreen
      rows={data?.channels ?? []}
      keyFor={channel => channel.packageName}
      header={
        <>
          <BackButton to="Profile" label="Back to Profile" />
          <T accessibilityRole="header" className="text-30 font-medium">
            Connected Apps
          </T>
          <T className="text-15 text-ink-2">Choose what MIRA can access.</T>
          <T className="text-14 text-ink-body">
            Only notifications from apps you switch on are read. Replies always
            need your approval. Turning an app off stops new capture; existing
            messages stay on this phone.
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
                Allow notification access so MIRA can read your chosen apps.
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
          {data?.channels.length === 0 ? (
            <T>
              No notification apps found. Tap Refresh apps after installing an
              app.
            </T>
          ) : null}
        </>
      }
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
              <T className="text-13 text-ink-2">
                {channel.enabled ? 'Reading notifications' : 'Off'}
              </T>
            </View>
            <Switch on={channel.enabled} />
          </Tap>
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
        </Glass>
      )}
      footer={<SecondaryButton label="Refresh apps" onPress={retry} />}
    />
  );
}
