import type { ReactNode } from 'react';
import { View } from 'react-native';

import { useGo, type Board } from './nav';
import { Screen } from './Screen';
import { T } from './T';
import { BackButton, SecondaryButton } from './ui';

type Tab = 'Home' | 'Inbox' | 'Teach' | 'Planner';

/** The dashed "nothing here" card from the design system's empty state. */
export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <View className="gap-6 rounded-20 border-[1.5px] border-dashed border-peri-200 p-24">
      <T className="text-center text-16 font-bold">{title}</T>
      <T className="text-center text-14 leading-[21px] text-ink-2">{body}</T>
    </View>
  );
}

/**
 * A screen that has nothing of the user's to show. It says so plainly, and
 * points to where the real thing is, instead of showing sample content.
 */
export function EmptyBoard({
  title,
  lead,
  emptyTitle,
  emptyBody,
  back,
  backLabel,
  tab,
  header,
  action,
}: {
  title?: string;
  lead?: string;
  emptyTitle: string;
  emptyBody: string;
  back?: Board;
  backLabel?: string;
  tab?: Tab;
  /** Shown in place of the title, for screens with their own header row. */
  header?: ReactNode;
  action?: { label: string; to: Board };
}) {
  const go = useGo();
  return (
    <Screen tab={tab}>
      {back ? (
        <View className="flex-row items-center">
          <BackButton to={back} label={backLabel} />
        </View>
      ) : null}
      {header ?? (
        <View className="gap-4">
          <T accessibilityRole="header" className="text-30 font-medium tracking-[-0.9px]">{title}</T>
          {lead ? <T className="text-15 text-ink-2">{lead}</T> : null}
        </View>
      )}
      <EmptyState title={emptyTitle} body={emptyBody} />
      {action ? <SecondaryButton label={action.label} onPress={() => go(action.to)} /> : null}
    </Screen>
  );
}
