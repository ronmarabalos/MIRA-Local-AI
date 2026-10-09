import type { ReportItem, ReportLine } from './report';
import type { Action } from './types';

/** A date MIRA found in a message. `at` is null when the phrase could not be pinned to a day. */
export interface PlannerEntry {
  item: ReportLine;
  at: number | null;
  /** True when a rule has set a reminder for this message. */
  reminder: boolean;
}

export interface Planner {
  today: PlannerEntry[];
  tomorrow: PlannerEntry[];
  thisWeek: PlannerEntry[];
  later: PlannerEntry[];
  undated: PlannerEntry[];
  passed: PlannerEntry[];
}

/** A day in a month grid. `date` is that day's local midnight. */
export interface DayCell {
  date: number;
  day: number;
  count: number;
  isToday: boolean;
}

const DAY = 24 * 60 * 60 * 1000;
/** Passed entries are kept this many days. */
const PASSED_DAYS = 7;

/** Local midnight at the start of the day holding `time`. */
export function startOfLocalDay(time: number): number {
  const date = new Date(time);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/** Whole local days from one midnight to another. Rounded, so a clock change does not shift it. */
const daysBetween = (fromMidnight: number, toMidnight: number) =>
  Math.round((toMidnight - fromMidnight) / DAY);

const soonest = (a: PlannerEntry, b: PlannerEntry) => (a.at ?? 0) - (b.at ?? 0);

/**
 * The dated messages (Inbox and Planner spec 3.1): read, with a date phrase,
 * not a copy, not chatter or a promotion, and not one that tried to give
 * instructions.
 */
export function plannerEntries(
  items: ReportItem[],
  actions: Action[],
): PlannerEntry[] {
  const reminded = new Set(
    actions
      .filter(a => a.kind === 'remind' && a.status === 'done')
      .map(a => a.messageId),
  );
  return items
    .filter(
      (item): item is ReportLine =>
        item.record !== null &&
        item.message.status === 'processed' &&
        item.record.dateText !== null &&
        item.record.duplicateOf === null &&
        !item.record.instructionLike &&
        item.record.type !== 'chatter' &&
        item.record.type !== 'promotion',
    )
    .map(item => ({
      item,
      at: item.record.dateAt,
      reminder: reminded.has(item.message.id),
    }));
}

/** The Tasks view's groups, by the phone's local day. */
export function groupEntries(entries: PlannerEntry[], now: number): Planner {
  const today = startOfLocalDay(now);
  const groups: Planner = {
    today: [],
    tomorrow: [],
    thisWeek: [],
    later: [],
    undated: [],
    passed: [],
  };

  for (const entry of entries) {
    if (entry.at === null) {
      groups.undated.push(entry);
      continue;
    }
    const days = daysBetween(today, startOfLocalDay(entry.at));
    if (days < -PASSED_DAYS) continue;
    if (days < 0) groups.passed.push(entry);
    else if (days === 0) groups.today.push(entry);
    else if (days === 1) groups.tomorrow.push(entry);
    else if (days <= 6) groups.thisWeek.push(entry);
    else groups.later.push(entry);
  }

  groups.today.sort(soonest);
  groups.tomorrow.sort(soonest);
  groups.thisWeek.sort(soonest);
  groups.later.sort(soonest);
  groups.passed.sort((a, b) => soonest(b, a));
  groups.undated.sort(
    (a, b) => b.item.message.postedAt - a.item.message.postedAt,
  );
  return groups;
}

/**
 * A month as weeks of seven, Sunday first, with null outside the month.
 * `month` is 0 for January to 11 for December.
 */
export function monthGrid(
  year: number,
  month: number,
  entries: PlannerEntry[],
  now: number,
): (DayCell | null)[][] {
  const counts = new Map<number, number>();
  for (const entry of entries) {
    if (entry.at === null) continue;
    const day = startOfLocalDay(entry.at);
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }

  const today = startOfLocalDay(now);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (DayCell | null)[] = Array(
    new Date(year, month, 1).getDay(),
  ).fill(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day).getTime();
    cells.push({
      date,
      day,
      count: counts.get(date) ?? 0,
      isToday: date === today,
    });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (DayCell | null)[][] = [];
  for (let start = 0; start < cells.length; start += 7)
    weeks.push(cells.slice(start, start + 7));
  return weeks;
}

/** The entries on one local day (given as its midnight), soonest first. */
export function entriesOn(
  date: number,
  entries: PlannerEntry[],
): PlannerEntry[] {
  return entries
    .filter(entry => entry.at !== null && startOfLocalDay(entry.at) === date)
    .sort(soonest);
}
