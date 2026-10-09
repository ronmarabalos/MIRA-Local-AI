# Today and Item Detail (B2.3)

Priority: P0. Execution: Tier 2, bounded integration of existing storage, report logic, and screens. Approved scope: the user's request to implement the proposed next step.

## Problem and approach

The student can have captured messages in SQLite but Home still shows sample tasks. Home will read the current day's stored messages and actions, call `buildReport`, and display its sections using the existing silk background, Onest typography, glass surfaces, and floating navigation. A virtualized list will keep longer reports responsive. Read another page on request rather than silently treating the first 200 messages as the entire day.

Each report entry opens EmailDetail with its message ID. Detail reads that ID from SQLite, labels MIRA's summary, and displays the original notification text with sender, app, chat, and timestamp. Long originals have Show all. App labels come from stored channels, with package name as an honest fallback. A category correction writes the existing record while preserving safety flags and source text.

Use existing `useQuery`, store methods, and `buildReport`; no new dependencies or native changes. Incoming writes refresh the report. Returning to the foreground refreshes the day. Queued actions are labelled Queued, never completed, and action entries include their source even when that message arrived on an earlier day.

## States and acceptance criteria

- Given today's stored messages, when Home opens, then Needs you, Dates found, Announcements, Handled for you, Ignored, and Couldn't read reflect `buildReport`, with no sample counts or invented activity.
- Given a report entry, when tapped, then detail displays that exact stored message, including its source, and Back returns to the report.
- Given a pending read, show labelled placeholder rows; given unprocessed messages, show reading placeholders while retaining finished content.
- Given no messages or actions today, show an empty explanation and a Choose apps action.
- Given a database error, show plain recovery wording and Retry, without raw database errors or misleading empty content.
- Given a missing or deleted message ID, show a missing-item state and a route back to Home; never substitute a sample message.
- Given a new storage write, the mounted report refreshes; given an older async read finishing after a newer read, it cannot overwrite newer data.
- Given no connection, stored reports and detail still work and say that saved messages are available offline.
- Given a category correction, persist it, refresh the report, retain the original text and safety flags, and display failure without pretending it was saved.
- Given a longer report, Load more retrieves older messages from today, with a clear limit notice while only part of the day is shown.

## Scope boundaries

This task wires Home and EmailDetail. Inbox's demo interface, Connected Apps integration (B2.4), drafting/sending, automations, privacy proof, and native permissions remain separate tasks. Existing links to detail without an ID lead to the missing-selection state. Shared lane contracts and dependencies stay frozen.

## Verification

Test-first screen integration tests exercise real SQLite queries with the native database boundary replaced by Node SQLite. Cover report-to-detail navigation, source identity, write refresh, empty/error/loading states, pending/failed messages, corrections, and pagination. Run scoped Baton verification, full Baton regression/typecheck, and lint on changed files. Device visual checks at 130% font size remain explicit if no Android device is available.
