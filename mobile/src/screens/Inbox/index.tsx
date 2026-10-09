/** Board 13-inbox: every message MIRA has stored, newest first, narrowed by a filter or an app. */
import { useState } from 'react';
import { View } from 'react-native';

import { EmptyState } from '../../components/EmptyBoard';
import { ReportItem } from '../../components/ReportItem';
import { Screen } from '../../components/Screen';
import { T } from '../../components/T';
import { FilterPills, Tap } from '../../components/ui';
import { buildInbox, type InboxFilter, labelLine } from '../../core/inbox';
import { useChannels, useQuery } from '../../services/db/hooks';

const DAY = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 30;
const PAGE = 50;
/** A ceiling on what is loaded, not on what is drawn: only PAGE rows are drawn at a time. */
const MAX_ITEMS = 2000;
const ALL_APPS = 'all';

/** "5:08 AM" for a message from today; "Oct 7 · 5:08 AM" for an earlier one. */
function arrivalOf(at: number): string {
  const date = new Date(at);
  const time = date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
  if (date.toDateString() === new Date().toDateString()) return time;
  return `${date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })} · ${time}`;
}

export default function InboxScreen() {
  const [filter, setFilter] = useState<InboxFilter>('all');
  const [app, setApp] = useState(ALL_APPS);
  const [shown, setShown] = useState(PAGE);
  const stored = useQuery(store => {
    const now = Date.now();
    // A day ahead as well: a message can carry a time slightly ahead of this phone's clock.
    return store.getItems(now - WINDOW_DAYS * DAY, now + DAY, MAX_ITEMS);
  }, []);
  const { data: channels } = useChannels();

  const inbox = buildInbox(stored.data ?? [], {
    filter,
    packageName: app === ALL_APPS ? null : app,
  });
  const appName = (packageName: string) =>
    channels?.find(channel => channel.packageName === packageName)?.label ??
    'Another app';

  return (
    <Screen tab="Inbox">
      <View className="gap-4">
        <T
          accessibilityRole="header"
          className="text-30 font-medium tracking-[-0.9px]"
        >
          Inbox
        </T>
        <T className="text-15 text-ink-2">
          Every message MIRA has read, newest first.
        </T>
      </View>

      <FilterPills<InboxFilter>
        label="Filter"
        value={filter}
        onChange={next => {
          setFilter(next);
          setShown(PAGE);
        }}
        items={[
          { id: 'all', label: 'All', count: inbox.counts.all },
          { id: 'needs', label: 'Needs you', count: inbox.counts.needs },
          { id: 'dated', label: 'With a date', count: inbox.counts.dated },
          { id: 'ignored', label: 'Ignored', count: inbox.counts.ignored },
        ]}
      />
      {inbox.apps.length > 1 ? (
        <FilterPills<string>
          label="App"
          value={app}
          onChange={next => {
            setApp(next);
            setShown(PAGE);
          }}
          items={[
            { id: ALL_APPS, label: 'All apps' },
            ...inbox.apps.map(entry => ({
              id: entry.packageName,
              label: appName(entry.packageName),
              count: entry.count,
            })),
          ]}
        />
      ) : null}

      {stored.error ? (
        <Tap
          label="Try again"
          onPress={stored.retry}
          className="rounded-16 bg-error-bg px-14 py-12"
        >
          <T className="text-13 font-semibold text-error-ink">
            Your messages could not be loaded. Tap to try again.
          </T>
        </Tap>
      ) : stored.data === undefined ? (
        <T className="text-14 text-ink-2">Loading…</T>
      ) : stored.data.length === 0 ? (
        <EmptyState
          title="Nothing here yet"
          body="Messages from the apps you switch on will be listed here."
        />
      ) : inbox.rows.length === 0 ? (
        <EmptyState
          title="No messages match this filter"
          body="Choose another filter to see more."
        />
      ) : (
        <View>
          {inbox.rows.slice(0, shown).map(item => (
            <ReportItem
              key={item.message.id}
              item={item}
              appLabel={appName(item.message.packageName)}
              label={labelLine(item, arrivalOf(item.message.postedAt))}
            />
          ))}
          {inbox.rows.length > shown ? (
            <Tap
              label="Show more"
              onPress={() => setShown(shown + PAGE)}
              className="h-52 items-center justify-center rounded-16 border border-white/80 bg-white/60"
            >
              <T className="text-15 font-bold">Show more</T>
            </Tap>
          ) : null}
          {stored.data.length >= MAX_ITEMS ? (
            <T className="pt-10 text-center text-13 text-ink-2">
              Showing the latest 2,000 messages.
            </T>
          ) : null}
        </View>
      )}
    </Screen>
  );
}
