# Today and Item Detail Implementation Plan

> Execute inline with superpowers:executing-plans, using red-green tests and verification-before-completion.

**Goal:** Show stored messages on Home and open their exact originals.

**Architecture:** Existing SQLite store and `buildReport` remain authoritative. Query hooks feed a virtualized Home report and an ID-addressed EmailDetail screen. Shared SourceQuote and ReportItem components distinguish generated text from source text.

**Stack:** React Native 0.87.1, TypeScript, React Navigation, op-sqlite, NativeWind, Jest.

**Spec:** [Today and Item Detail](2026-10-10-today-and-item-detail.md).

## Constraints

- Lane B only; no dependency, native, or frozen service-contract changes.
- Use existing design tokens and controls; 48 dp touch targets.
- No draft sending or other native actions in this task.

## Steps

- [x] Inspect callers, design boards, storage hooks, report logic, and tests; settle scope from approved B2.3.
- [x] Write `mobile/__tests__/today.test.tsx` with a real SQLite store and notification-like fixtures; assert stored content, navigation to the correct original, refresh, failure/retry, empty/loading/pending states, category correction, and paging.
- [x] Run `npm run verify:agent -- --tier 2 --scope mobile/__tests__/today.test.tsx`; verify failures show the absent integration.
- [x] Extend `mobile/src/services/db/hooks.ts` with retry-safe queries and a day-report hook that reads messages/actions/channels, calls `buildReport`, and resolves older action sources. Test overlapping reads before editing query behavior.
- [x] Add `SourceQuote.tsx` and `ReportItem.tsx` under components; render quoted source separately from MIRA's summary, with stored app/chat labels.
- [x] Replace Home's sample content with report sections and a SectionList; keep the existing background, companion, theme, and tab navigation. Refresh on foreground/day change; expose Load more with a partial-report notice.
- [x] Add optional `{ messageId: string }` params for EmailDetail in `navigation.tsx` and replace its demo content with stored detail, missing/error states, Show all, and persisted category correction. Existing ID-less callers remain valid and show a selection prompt.
- [x] Update screen smoke-test expectations for the real data states; rerun scoped tests until green.
- [x] Run full `npm run verify:agent` and changed-file lint; inspect the final diff and record device-verification limits in the roadmap.


## Verification evidence

- Red: the new integration tests failed against the sample screens; the query ordering regression also failed before its fix.
- Green: all 12 SQLite-backed integration tests passed through Baton.
- Full regression and TypeScript: `npm run verify:agent -- --tier 2` passed on 2026-10-10.
- Changed-file ESLint: passed with no errors or warnings.
- Android follow-up (2026-10-10): Claude's arm64 debug APK installed successfully on the connected M2102J20SG phone using `adb install -r`. Restarted the unresponsive project Metro process; `/status` returned `packager-status:running` and the Android bundle returned HTTP 200 (9,609,840 bytes). Started MainActivity with USB port forwarding. After a temporary USB disconnect, restored forwarding and relaunched the app. ReactNativeJS logged `Running "Mira"`; the onboarding screen rendered correctly on the phone (screenshot inspected).
- Existing smoke tests now inspect rendered text and always unmount, because a virtualized list can carry circular context in its props.
- [x] Continue Claude's blocked debug APK installation and restore a responsive Metro server.
- [ ] Physical-device layout, system Back, and 130% font-size checks. MIRA is installed and onboarding renders; Home/Item Detail layout, system Back, and font-scale verification remain pending. The MIRA Metro terminal remains running.
