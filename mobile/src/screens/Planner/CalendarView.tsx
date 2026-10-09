/** Board 17-calendar: a month of the dates MIRA found, with the chosen day's entries below. */
import { type ReactNode, useState } from 'react';
import { View } from 'react-native';

import { Screen } from '../../components/Screen';
import { T } from '../../components/T';
import { Tap } from '../../components/ui';
import { entriesOn, monthGrid, startOfLocalDay } from '../../core/planner';
import { EntryRow, LoadState, usePlannerEntries } from './entries';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function CalendarView({ header }: { header: ReactNode }) {
  const state = usePlannerEntries();
  const entries = state.data ?? [];
  const now = Date.now();
  const today = new Date(now);
  const [shownMonth, setShownMonth] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });
  const [selected, setSelected] = useState(startOfLocalDay(now));

  /** `new Date` rolls the month over, so stepping past December or before January just works. */
  const step = (by: number) => {
    const next = new Date(shownMonth.year, shownMonth.month + by, 1);
    setShownMonth({ year: next.getFullYear(), month: next.getMonth() });
  };

  const monthName = MONTHS[shownMonth.month];
  const weeks = monthGrid(shownMonth.year, shownMonth.month, entries, now);
  const onDay = entriesOn(selected, entries);

  return (
    <Screen tab="Planner">
      {header}
      <LoadState state={state}>
        <View className="gap-10 rounded-22 border border-white/80 bg-white/46 p-16">
          <View className="flex-row items-center justify-between">
            <Tap
              label="Previous month"
              onPress={() => step(-1)}
              className="h-48 w-48 items-center justify-center"
            >
              <T className="text-20 font-bold text-navy">‹</T>
            </Tap>
            <T accessibilityRole="header" className="text-18 font-bold">
              {`${monthName} ${shownMonth.year}`}
            </T>
            <Tap
              label="Next month"
              onPress={() => step(1)}
              className="h-48 w-48 items-center justify-center"
            >
              <T className="text-20 font-bold text-navy">›</T>
            </Tap>
          </View>
          <View className="flex-row">
            {WEEKDAYS.map((letter, index) => (
              <T
                key={index}
                className="flex-1 text-center text-12 font-bold text-ink-label"
              >
                {letter}
              </T>
            ))}
          </View>
          {weeks.map((week, row) => (
            <View key={row} className="flex-row">
              {week.map((cell, column) =>
                cell === null ? (
                  <View key={column} className="h-48 flex-1" />
                ) : (
                  <Tap
                    key={column}
                    label={`${monthName} ${cell.day}${
                      cell.count
                        ? `, ${cell.count} ${
                            cell.count === 1 ? 'item' : 'items'
                          }`
                        : ''
                    }`}
                    accessibilityState={{ selected: cell.date === selected }}
                    onPress={() => setSelected(cell.date)}
                    className={`h-48 flex-1 items-center justify-center rounded-14 ${
                      cell.date === selected
                        ? 'bg-navy'
                        : cell.isToday
                        ? 'bg-peri-tonal'
                        : ''
                    }`}
                  >
                    <T
                      className={`text-14 font-semibold ${
                        cell.date === selected ? 'text-white' : 'text-ink'
                      }`}
                    >
                      {cell.day}
                    </T>
                    <View
                      className={`h-6 w-6 rounded-full ${
                        cell.count === 0
                          ? ''
                          : cell.date === selected
                          ? 'bg-white'
                          : 'bg-navy'
                      }`}
                    />
                  </Tap>
                ),
              )}
            </View>
          ))}
        </View>

        <View className="gap-8">
          <T accessibilityRole="header" className="text-20 font-semibold">
            {new Date(selected).toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </T>
          {onDay.length === 0 ? (
            <T className="text-14 text-ink-2">Nothing on this day.</T>
          ) : (
            <View>
              {onDay.map(entry => (
                <EntryRow key={entry.item.message.id} entry={entry} />
              ))}
            </View>
          )}
        </View>
      </LoadState>
    </Screen>
  );
}
