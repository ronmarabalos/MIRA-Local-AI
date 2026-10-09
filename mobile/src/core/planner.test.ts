import {
  entriesOn,
  groupEntries,
  monthGrid,
  plannerEntries,
  startOfLocalDay,
} from './planner';
import type { ReportItem } from './report';
import type { Action, MiraRecord } from './types';

// Local time throughout, as the app uses: Saturday 10 October 2026, 2:00 PM.
const at = (day: number, hour = 12, minute = 0, month = 9, year = 2026) =>
  new Date(year, month, day, hour, minute).getTime();
const NOW = at(10, 14);

let next = 0;
function item(
  dateAt: number | null,
  record: Partial<MiraRecord> = {},
  minutesAgo = 1,
): ReportItem {
  const id = `m${++next}`;
  return {
    message: {
      id,
      notificationKey: id,
      packageName: 'com.facebook.orca',
      chatId: 'c1',
      sender: 'Carla',
      text: 'text',
      postedAt: NOW - minutesAgo * 60_000,
      truncated: false,
      canReply: true,
      status: 'processed',
    },
    chat: {
      id: 'c1',
      packageName: 'com.facebook.orca',
      title: 'Chat',
      kind: 'private',
    },
    record: {
      messageId: id,
      type: 'deadline',
      summary: `summary ${id}`,
      needsUser: true,
      urgency: 'normal',
      request: null,
      amount: null,
      dateText: 'a date',
      dateAt,
      sensitive: false,
      instructionLike: false,
      duplicateOf: null,
      ...record,
    },
  };
}

const remind = (
  messageId: string,
  status: Action['status'] = 'done',
): Action => ({
  id: `a-${messageId}`,
  ruleId: 'builtin-remind',
  messageId,
  kind: 'remind',
  payload: {},
  status,
  reason: null,
  createdAt: NOW,
  doneAt: NOW,
});

const ids = (entries: { item: ReportItem }[]) =>
  entries.map(e => e.item.message.id);

describe('plannerEntries', () => {
  test('a read message with a date phrase becomes an entry, with or without a resolved date', () => {
    const dated = item(at(12));
    const phraseOnly = item(null, { dateText: 'soon' });
    const entries = plannerEntries([dated, phraseOnly], []);
    expect(entries.map(e => e.at)).toEqual([at(12), null]);
  });

  test('messages without a date phrase, copies, chatter, promotions, hostile, and unread ones are left out', () => {
    const excluded: ReportItem[] = [
      item(at(12), { dateText: null }),
      item(at(12), { duplicateOf: 'm0' }),
      item(at(12), { type: 'chatter' }),
      item(at(12), { type: 'promotion' }),
      item(at(12), { instructionLike: true }),
      { ...item(at(12)), record: null },
    ];
    const failed = item(at(12));
    failed.message.status = 'failed';
    expect(plannerEntries([...excluded, failed], [])).toEqual([]);
  });

  test('an entry has a reminder only when a remind action for its message is done', () => {
    const withReminder = item(at(12));
    const blocked = item(at(13));
    const none = item(at(14));
    const entries = plannerEntries(
      [withReminder, blocked, none],
      [remind(withReminder.message.id), remind(blocked.message.id, 'blocked')],
    );
    expect(entries.map(e => e.reminder)).toEqual([true, false, false]);
  });
});

describe('groupEntries', () => {
  test('entries fall into Today, Tomorrow, This week, and Later by local day, soonest first', () => {
    const today = item(at(10, 18));
    const earlierToday = item(at(10, 9));
    const tomorrow = item(at(11, 8));
    const inTwoDays = item(at(12));
    const inSixDays = item(at(16));
    const inSevenDays = item(at(17));
    const nextMonth = item(at(5, 12, 0, 10));
    const groups = groupEntries(
      plannerEntries(
        [
          nextMonth,
          inSevenDays,
          inSixDays,
          inTwoDays,
          tomorrow,
          today,
          earlierToday,
        ],
        [],
      ),
      NOW,
    );
    // Earlier today is still today: the day decides, not the hour.
    expect(ids(groups.today)).toEqual(
      ids([{ item: earlierToday }, { item: today }]),
    );
    expect(ids(groups.tomorrow)).toEqual([tomorrow.message.id]);
    expect(ids(groups.thisWeek)).toEqual([
      inTwoDays.message.id,
      inSixDays.message.id,
    ]);
    expect(ids(groups.later)).toEqual([
      inSevenDays.message.id,
      nextMonth.message.id,
    ]);
  });

  test('a minute before midnight is today and a minute after is tomorrow, whatever the hour is now', () => {
    const beforeMidnight = item(at(10, 23, 59));
    const afterMidnight = item(at(11, 0, 1));
    for (const now of [at(10, 0, 5), at(10, 23, 58)]) {
      const groups = groupEntries(
        plannerEntries([beforeMidnight, afterMidnight], []),
        now,
      );
      expect(ids(groups.today)).toEqual([beforeMidnight.message.id]);
      expect(ids(groups.tomorrow)).toEqual([afterMidnight.message.id]);
    }
  });

  test('the last 7 days are Passed, most recent first; anything older is dropped', () => {
    const yesterday = item(at(9, 20));
    const weekAgo = item(at(3, 8));
    const eightDaysAgo = item(at(2, 23));
    const groups = groupEntries(
      plannerEntries([eightDaysAgo, weekAgo, yesterday], []),
      NOW,
    );
    expect(ids(groups.passed)).toEqual([
      yesterday.message.id,
      weekAgo.message.id,
    ]);
    expect(groups.today).toEqual([]);
  });

  test('entries with a phrase but no resolved date are under No exact date, newest message first', () => {
    const older = item(null, { dateText: 'soon' }, 30);
    const newer = item(null, { dateText: 'next time' }, 2);
    const groups = groupEntries(plannerEntries([older, newer], []), NOW);
    expect(ids(groups.undated)).toEqual([newer.message.id, older.message.id]);
  });

  test('with no entries every group is empty', () => {
    expect(groupEntries([], NOW)).toEqual({
      today: [],
      tomorrow: [],
      thisWeek: [],
      later: [],
      undated: [],
      passed: [],
    });
  });
});

describe('monthGrid', () => {
  const days = (grid: ReturnType<typeof monthGrid>) =>
    grid.map(week => week.map(cell => cell?.day ?? 0));

  test('October 2026 starts on a Thursday and has 31 days in weeks of seven', () => {
    const grid = monthGrid(2026, 9, [], NOW);
    expect(grid.every(week => week.length === 7)).toBe(true);
    expect(days(grid)[0]).toEqual([0, 0, 0, 0, 1, 2, 3]);
    expect(days(grid).at(-1)).toEqual([25, 26, 27, 28, 29, 30, 31]);
  });

  test('a month starting on Sunday has no blank cells before the 1st', () => {
    // 1 November 2026 is a Sunday.
    expect(days(monthGrid(2026, 10, [], NOW))[0]).toEqual([
      1, 2, 3, 4, 5, 6, 7,
    ]);
  });

  test('February has 28 days, and 29 in a leap year', () => {
    const count = (year: number) =>
      monthGrid(year, 1, [], NOW).flat().filter(Boolean).length;
    expect(count(2026)).toBe(28);
    expect(count(2028)).toBe(29);
  });

  test('a day counts its entries, and only today is marked', () => {
    const entries = plannerEntries(
      [item(at(12, 9)), item(at(12, 23, 59)), item(at(11)), item(null)],
      [],
    );
    const cells = monthGrid(2026, 9, entries, NOW).flat();
    const cell = (day: number) => cells.find(c => c?.day === day)!;
    expect(cell(12).count).toBe(2);
    expect(cell(11).count).toBe(1);
    expect(cell(13).count).toBe(0);
    expect(cells.filter(c => c?.isToday).map(c => c!.day)).toEqual([10]);
    expect(cell(12).date).toBe(startOfLocalDay(at(12)));
  });

  test('an entry in another month does not count, and today is not marked there', () => {
    const cells = monthGrid(
      2026,
      10,
      plannerEntries([item(at(12))], []),
      NOW,
    ).flat();
    expect(cells.every(c => !c || (c.count === 0 && !c.isToday))).toBe(true);
  });
});

describe('entriesOn', () => {
  test("gives that local day's entries, soonest first, and never undated ones", () => {
    const evening = item(at(12, 20));
    const morning = item(at(12, 8));
    const other = item(at(13));
    const undated = item(null);
    const entries = plannerEntries([evening, morning, other, undated], []);
    expect(ids(entriesOn(startOfLocalDay(at(12)), entries))).toEqual([
      morning.message.id,
      evening.message.id,
    ]);
  });
});
