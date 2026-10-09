# Inbox and Planner — Design Spec

- **Date:** 2026-10-10
- **Status:** Draft for review
- **Owner:** Steve. Both screens are in Ronmar's lane and are changed with his knowledge.
- **Related:** [main spec](2026-10-09-mira-design.md) sections 4.10 and 7 · visual boards [`13-inbox`](../design/screens/13-inbox.html), [`16-tasks-and-reminders`](../design/screens/16-tasks-and-reminders.html), [`17-calendar`](../design/screens/17-calendar.html)

---

## 1. Goal

The Inbox and Planner tabs show the user's own data. Today they show a "nothing here" state and nothing feeds them.

- **Inbox:** every message MIRA has stored, newest first, narrowed by a filter or an app, each opening the message.
- **Planner:** the dates MIRA found in messages, as an upcoming list (Tasks) and a month view (Calendar). It fills itself in as messages are read.

**Success:** on the Infinix, the two real deadlines stored on the phone (October 11 and October 12) appear in the Inbox, under the right days in Tasks, and as dots on those days in the month view, each opening its message.

### Decisions made with Steve

1. **The calendar is MIRA's own.** Nothing is written to the phone's calendar. No new permission. Nothing can sync to an account.
2. **Two features, built in order:** Inbox first, then Planner. Each works without the other.

### Out of scope

Writing to or reading the phone's calendar · the `calendar` rule action (still logged as "not part of this build") · adding a task by hand · marking an item done · searching the Inbox · clash warnings.

---

## 2. Inbox

### 2.1 What it shows

All stored messages from the last 30 days, newest first. A copy of an earlier message is not listed; the first message carries how often it was seen.

**Filters**, shown as pills with a count:

| Filter | A message is in it when |
| :--- | :--- |
| All | Always (copies excepted) |
| Needs you | It was read, needs the user, is not chatter or a promotion, and did not try to give instructions |
| With a date | It was read, has a date phrase, and did not try to give instructions |
| Ignored | Its type is chatter or promotion |

**Apps.** When the listed messages come from more than one app, a second row of pills narrows to one app. Counts on the filter pills follow the chosen app.

**Each row** is the shared report row: sender, MIRA's summary with its label, the quoted original with app and chat, and "Sent N times" when copies were merged. Above the sender, one line of labels:

| Message state | Label line |
| :--- | :--- |
| Read | The type in plain words, then "Needs you" if it does, then the date phrase if any, then the time it arrived. Example: `Deadline · Needs you · oct 12 · 5:08 AM` |
| Chatter or promotion | `Ignored · Chatter · 5:08 AM` |
| Tried to give instructions | `Blocked · 5:08 AM` |
| Still being read | `Reading… · 5:08 AM` |
| Could not be read | `Couldn't read · 5:08 AM` |

Tapping a row opens the message detail.

**Paging.** The first 50 rows are shown, with "Show more" adding 50 at a time. The list is never rendered in full.

**Empty states.** No stored messages at all: "Nothing here yet. Messages from the apps you switch on will be listed here." A filter with no rows: "No messages match this filter."

### 2.2 Logic — `mobile/src/core/inbox.ts` (new, pure)

```ts
type InboxFilter = 'all' | 'needs' | 'dated' | 'ignored';

interface Inbox {
  rows: ReportItem[];                       // filtered, newest first, with `seen` set on merged originals
  counts: Record<InboxFilter, number>;      // for the chosen app
  apps: { packageName: string; count: number }[];   // every app with at least one message, most first
}

buildInbox(items: ReportItem[], options: { filter: InboxFilter; packageName: string | null }): Inbox
labelLine(item: ReportItem, time: string): string
```

`labelLine` builds the label line in 2.1; the screen passes the formatted time.

---

## 3. Planner

### 3.1 Which messages become entries

A message becomes an entry when it was read, has a date phrase, is not a copy, is not chatter or a promotion, and did not try to give instructions. It is taken from messages stored in the last 30 days.

An entry has:

- **when:** the resolved date and time (`dateAt`), or none when MIRA found a phrase it could not pin to a day;
- **the message** it came from, with its summary and chat;
- **reminder set:** true when a `remind` action for that message is done.

### 3.2 Tasks view

Entries with a resolved date, soonest first, in these groups by the phone's local day:

| Group | Entries whose date is |
| :--- | :--- |
| Today | today |
| Tomorrow | tomorrow |
| This week | 2 to 6 days from today |
| Later | 7 or more days from today |

Then two more groups:

- **No exact date:** entries with a phrase but no resolved date, newest message first.
- **Passed:** entries dated within the last 7 days before today, most recent first. Older ones are not shown.

A group with no entries is not shown. Each row shows the date and time (or the phrase as written), the summary, the chat, and "Reminder set" when it has one. Tapping opens the message.

**Empty state:** "Nothing coming up. Dates MIRA finds in your messages will appear here."

### 3.3 Calendar view

A month grid, Sunday first, opening on the current month.

- A day with at least one entry carries a dot. Today is marked.
- Arrows move to the previous and next month; the title reads like "October 2026".
- Tapping a day lists that day's entries under the grid, as in Tasks. Today is selected on opening.
- Entries with no resolved date do not appear here.

### 3.4 Logic — `mobile/src/core/planner.ts` (new, pure)

```ts
interface PlannerEntry { item: ReportLine; at: number | null; reminder: boolean }

interface Planner {
  today: PlannerEntry[]; tomorrow: PlannerEntry[]; thisWeek: PlannerEntry[]; later: PlannerEntry[];
  undated: PlannerEntry[]; passed: PlannerEntry[];
}

plannerEntries(items: ReportItem[], actions: Action[]): PlannerEntry[]
groupEntries(entries: PlannerEntry[], now: number): Planner

interface DayCell { date: number; day: number; count: number; isToday: boolean }   // date = local midnight
monthGrid(year: number, month: number, entries: PlannerEntry[], now: number): (DayCell | null)[][]   // weeks of 7, null outside the month
entriesOn(date: number, entries: PlannerEntry[]): PlannerEntry[]
```

All day arithmetic uses the phone's local time, through `Date`, so a day is midnight to midnight where the user is.

---

## 4. Screens

| Screen | File | Change |
| :--- | :--- | :--- |
| Inbox | `mobile/src/screens/Inbox/index.tsx` | Replaces the empty state |
| Tasks | `mobile/src/screens/Planner/TasksView.tsx` | Replaces the empty state |
| Calendar | `mobile/src/screens/Planner/CalendarView.tsx` | Replaces the empty state |

Both tabs read storage through `useQuery`, so they refresh after every write, which is what makes them fill in as messages arrive. The Planner's Tasks / Calendar switch (`PlannerHeader`) is kept as it is.

Built from existing components (`Screen`, `ReportItem`, `FilterPills`, `EmptyState`, `Tap`, `T`) and theme tokens. No raw colours or one-off sizes.

---

## 5. Rules it keeps

1. Every row and every date links to the original message (main spec, safety requirement 7).
2. A message that tried to give instructions is never shown as something to do or as a date.
3. Nothing leaves the phone. No new permission, no new storage, no model call.
4. Anything MIRA wrote carries its label; the shared report row already does this.
5. No technical terms in the interface.

---

## 6. Failure handling

| Situation | What the user sees |
| :--- | :--- |
| Storage cannot be read | "Your messages could not be loaded." with a "Try again" button |
| Still loading | "Loading…" |
| Nothing stored, or nothing matches | The empty states in 2.1 and 3.2 |
| A date the model misread | The entry shows on the wrong day. Every entry opens its message, where the category and the original can be checked |

---

## 7. Testing

**Unit tests, written first**

- `core/inbox.test.ts`: each filter's membership; counts for all filters at once; the app pills and the app filter; copies hidden and counted on the first message; hostile messages only under All; newest first; the label line for each message state.
- `core/planner.test.ts`: which messages become entries; reminder set from a done `remind` action; grouping into Today, Tomorrow, This week, Later, No exact date, Passed, including a date just before and just after midnight and an entry more than 7 days past; the month grid for a month starting on Sunday, a month starting mid-week, February, and December into January; `isToday`; `entriesOn`.
- Screen tests: the Inbox with rows, a filter, and each empty state; Tasks with groups; Calendar with a dot, day selection, and month change.

**On the phone**

- The October 11 and October 12 deadlines appear in the Inbox, under the right group in Tasks, and as dots in October.
- Switching filters and apps in the Inbox changes the list and the counts.
- A new dated message appears in Planner without leaving and reopening the tab.

---

## 8. Known limits

- A date is only as good as what MIRA read. A phrase with a time but no day, or a date the model missed, shows under "No exact date" or not at all.
- The Inbox and Planner look at messages stored in the last 30 days.
- Past entries older than 7 days are dropped from Tasks, though they remain as dots in earlier months of the Calendar view.
