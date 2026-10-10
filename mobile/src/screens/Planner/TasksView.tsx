/** Board 16-tasks-and-reminders: the dates MIRA found in messages, soonest first. */
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { EmptyState } from '../../components/EmptyBoard';
import { Screen } from '../../components/Screen';
import { T } from '../../components/T';
import { groupEntries, type Planner } from '../../core/planner';
import {
  EntryRow,
  LoadState,
  useAppNames,
  useNow,
  usePlannerEntries,
} from './entries';

const GROUPS: [keyof Planner, string][] = [
  ['today', 'Today'],
  ['tomorrow', 'Tomorrow'],
  ['thisWeek', 'This week'],
  ['later', 'Later'],
  ['undated', 'No exact date'],
  ['passed', 'Passed'],
];

export function TasksView({ header }: { header: ReactNode }) {
  const state = usePlannerEntries();
  const now = useNow();
  const appName = useAppNames();
  const groups = groupEntries(state.data ?? [], now);
  const empty = GROUPS.every(([key]) => groups[key].length === 0);

  return (
    <Screen tab="Planner">
      {header}
      <LoadState state={state}>
        {empty ? (
          <EmptyState
            title="Nothing coming up"
            body="Dates from your messages show up here."
          />
        ) : (
          GROUPS.filter(([key]) => groups[key].length > 0).map(
            ([key, title]) => (
              <View key={key} className="gap-8">
                <T accessibilityRole="header" className="text-20 font-semibold">
                  {title}
                </T>
                <View>
                  {groups[key].map(entry => (
                    <EntryRow
                      key={entry.item.message.id}
                      entry={entry}
                      appLabel={appName(entry.item.message.packageName)}
                    />
                  ))}
                </View>
              </View>
            ),
          )
        )}
      </LoadState>
    </Screen>
  );
}
