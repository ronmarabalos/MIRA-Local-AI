/** Board 05: the daily report, built entirely from saved messages. */
import { useEffect, useState } from 'react';
import { AppState, SectionList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGo } from '../../components/nav';
import { ReportItem } from '../../components/ReportItem';
import { useStatusBar } from '../../components/Screen';
import { SilkBackground } from '../../components/SilkBackground';
import { TabBar } from '../../components/TabBar';
import { T } from '../../components/T';
import { Glass, Tap } from '../../components/ui';
import type { ReportItem as StoredItem } from '../../core/report';
import type { ActionKind } from '../../core/types';
import { useDayReport } from '../../services/db/hooks';
import { useDisplayName, usePrefs } from '../../theme/prefs';
import { GetToKnow, Greeting } from './Greeting';

const ACTION_LABELS: Record<ActionKind, string> = {
  remind: 'Reminder',
  calendar: 'Calendar entry',
  alert: 'Alert',
  file: 'Filed message',
  draft: 'Draft reply',
  send: 'Send reply',
};
type Row = { key: string; item: StoredItem | null; label?: string };
type Section = { title: string; data: Row[] };
const styles = StyleSheet.create({ content: { paddingHorizontal: 18 } });

export default function HomeScreen() {
  const go = useGo();
  const name = useDisplayName();
  const { isDark: dark } = usePrefs();
  const insets = useSafeAreaInsets();
  const [day, setDay] = useState(Date.now);
  const [limit, setLimit] = useState(200);
  const { data, error, retry } = useDayReport(day, limit);
  useStatusBar(dark);

  useEffect(() => {
    const refresh = () => {
      setDay(Date.now());
      retry();
    };
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') refresh();
    });
    // Keep Today on the correct day even when the app stays open at midnight.
    const next = new Date(day);
    next.setHours(24, 0, 0, 0);
    const timer = setTimeout(refresh, Math.max(1, next.getTime() - Date.now()));
    return () => {
      subscription.remove();
      clearTimeout(timer);
    };
  }, [day, retry]);

  const ink = dark ? 'text-dk-text' : 'text-ink';
  const sub = dark ? 'text-dk-text3' : 'text-ink-2';
  const link = dark ? 'text-dk-accent' : 'text-navy';
  const report = data?.report;
  const rows = (items: StoredItem[], date = false): Row[] =>
    items.map(item => ({
      key: item.message.id,
      item,
      label: date && item.record?.dateAt != null ? new Date(item.record.dateAt).toLocaleString() : undefined,
    }));
  const sections: Section[] =
    report && !error
      ? [
          { title: 'Needs you', data: rows(report.needsYou) },
          { title: 'Dates found', data: rows(report.datesFound, true) },
          { title: 'Announcements', data: rows(report.announcements) },
          {
            title: 'Handled for you',
            data: report.handled.map(line => ({
              key: line.action.id,
              item: line.item,
              label: `${line.action.status === 'queued' ? 'Queued' : 'Completed'} · ${
                ACTION_LABELS[line.action.kind]
              }`,
            })),
          },
          { title: "Couldn't read", data: rows(report.couldNotRead) },
          {
            title: 'Reading messages',
            data: rows(data!.items.filter(item => item.message.status === 'new')),
          },
        ].filter(section => section.data.length > 0)
      : [];
  const empty = data && data.items.length === 0 && data.report.handled.length === 0;

  return (
    <View className={`flex-1 ${dark ? 'bg-dk-bg' : 'bg-silk-base'}`}>
      <SilkBackground dark={dark} />
      <SectionList<Row, Section>
        sections={sections}
        keyExtractor={row => row.key}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + 120,
          },
        ]}
        ListHeaderComponent={
          <View className="gap-18 pb-12">
            <View className="flex-row items-center justify-between gap-12">
              <T accessibilityRole="header" className={`text-30 font-semibold ${ink}`}>
                Today
              </T>
              <Tap
                label="Profile"
                onPress={() => go('Profile')}
                glass={dark ? 'dark' : 'glass'}
                className="min-h-48 min-w-48 items-center justify-center rounded-full px-14"
              >
                <T className={`text-15 font-semibold ${ink}`}>{name}</T>
              </Tap>
            </View>
            <Greeting dark={dark} thinking={!!report?.waiting} />
            {data && !error ? <GetToKnow channels={data.channels} dark={dark} /> : null}
            {error ? (
              <Glass
                kind={dark ? 'dark' : 'glass'}
                className="gap-8 rounded-22 p-16"
                accessibilityRole="alert"
              >
                <T className={`text-16 font-semibold ${ink}`}>Could not load saved messages</T>
                <T className={`text-14 ${sub}`}>
                  Try reading them again. Your saved messages have not been changed.
                </T>
                <Tap label="Retry" onPress={retry} className="min-h-48 justify-center">
                  <T className={`text-15 font-semibold ${link}`}>Retry</T>
                </Tap>
              </Glass>
            ) : !data ? (
              <View
                accessibilityLabel="Loading saved messages"
                accessibilityState={{ busy: true }}
                className="gap-10"
              >
                <T className={`text-14 ${sub}`}>Loading saved messages</T>
                {[0, 1].map(key => (
                  <Glass key={key} kind={dark ? 'dark' : 'glass'} className="h-96 gap-12 rounded-22 p-16">
                    <View className={`h-14 w-3/4 rounded-full ${dark ? 'bg-white/10' : 'bg-white/60'}`} />
                    <View className={`h-14 w-1/2 rounded-full ${dark ? 'bg-white/10' : 'bg-white/60'}`} />
                  </Glass>
                ))}
              </View>
            ) : empty ? (
              <Glass kind={dark ? 'dark' : 'glass'} className="gap-8 rounded-22 p-18">
                <T className={`text-18 font-semibold ${ink}`}>No messages today</T>
                <T className={`text-14 leading-[22px] ${sub}`}>
                  New messages from the apps you choose will appear here with their original source.
                </T>
                <Tap
                  label="Choose apps"
                  onPress={() => go('ConnectedApps')}
                  className="min-h-48 justify-center"
                >
                  <T className={`text-15 font-semibold ${link}`}>Choose apps</T>
                </Tap>
              </Glass>
            ) : (
              <View className="gap-6">
                <T className={`text-14 ${sub}`}>{`${report!.needsYou.length} need you · ${
                  report!.datesFound.length
                } dates found`}</T>
                {data.hasMore ? (
                  <T
                    className={`text-13 ${sub}`}
                  >{`Showing the latest ${limit} messages today. Load more for earlier messages and counts.`}</T>
                ) : null}
                {sections.length === 0 ? (
                  <T className={`text-16 ${ink}`}>Nothing needs your attention today.</T>
                ) : null}
              </View>
            )}
          </View>
        }
        renderSectionHeader={({ section }) => (
          <T accessibilityRole="header" className={`pb-10 pt-16 text-20 font-semibold ${ink}`}>
            {section.title}
          </T>
        )}
        renderItem={({ item: row }) =>
          row.item ? (
            <ReportItem
              item={row.item}
              label={row.label}
              dark={dark}
              appLabel={
                data?.channels.find(channel => channel.packageName === row.item!.message.packageName)?.label
              }
            />
          ) : (
            <Glass kind={dark ? 'dark' : 'glass'} className="mb-10 gap-6 rounded-22 p-16">
              <T className={`text-15 font-semibold ${ink}`}>{row.label}</T>
              <T className={`text-14 ${sub}`}>The original message is no longer available.</T>
            </Glass>
          )
        }
        ListFooterComponent={
          data && !error ? (
            <View className="gap-8 pt-16">
              <T className={`text-14 ${sub}`}>{`Ignored: ${
                report!.ignored
              } promotions and short messages`}</T>
              {data.hasMore ? (
                <Tap
                  label="Load more"
                  onPress={() => setLimit(value => value + 200)}
                  glass={dark ? 'dark' : 'glass'}
                  className="min-h-48 items-center justify-center rounded-full px-18"
                >
                  <T className={`text-15 font-semibold ${link}`}>Load more</T>
                </Tap>
              ) : null}
            </View>
          ) : undefined
        }
      />
      <TabBar active="Home" dark={dark} />
    </View>
  );
}
