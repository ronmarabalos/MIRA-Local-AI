# Universal Living Roadmap & Feature Plan: mira

> **For Steve, Ronmar, and AI Agents:** This document is the single source of truth for the project. No feature is implemented without an entry here. Keep it updated after every completed task.

- **Project:** mira
- **Objective:** MIRA: a private on-device assistant that reads notifications from the apps you choose, reports what matters, and handles what you have approved. No internet access of its own.
- **Archetype:** mobile-local-ai
- **Last Synchronized:** 2026-10-10
- **Sync Protocol:** [`scripts/baton.mjs`](../scripts/baton.mjs) via `npm run verify:agent`
- **Spec:** [`docs/specs/2026-10-09-mira-design.md`](specs/2026-10-09-mira-design.md) (approved by both developers on 2026-10-10)
- **Visual design:** [`docs/design/README.md`](design/README.md)

---

## Mission & Hackathon Objective

MIRA: a private on-device assistant that reads notifications from the apps you choose, reports what matters, and handles what you have approved. No internet access of its own.

Success at judging: the demo script in spec section 10.3 runs on the Infinix GT 20 Pro, including the airplane-mode section, with no step faked.

---

## Current Sprint Focus

Active phase: **Phase 0: Setup, together**

About 8 to 13 hours remained when this plan was written. Phases are sized for 10 hours, counted from the moment Phase 0 starts (**T+0**), which leaves up to 3 hours of slack. Update "Active phase" above each time a phase's exit check passes.

| Phase | Window | Exit check |
| :--- | :--- | :--- |
| 0. Setup, together | T+0:00 to T+0:30 | Both pull the same `main`; it builds and runs on the Infinix |
| 1. Prove the risky parts | T+0:30 to T+2:30 | Every row of spec section 11 has an answer; a model answers on the phone |
| 2. Core loop | T+2:30 to T+5:30 | A real message sent to the phone appears on Today with its source (demo steps 1 to 3) |
| 3. Drafts, rules, privacy | T+5:30 to T+7:30 | Draft approved; hostile message ignored and logged; Privacy proof opens (demo steps 6, 7, 9) |
| 4. Offline and polish | T+7:30 to T+9:00 | Airplane-mode section works (demo step 8) |
| 5. Freeze and rehearse | T+9:00 to T+10:00 | Demo run three times on the release build; backup recording made |

**Scope for this window.** Kept: capture, extraction, Today with sources, item detail, channels, drafts with approval, rule engine with hard limits, activity log, offline queue, release build with no internet permission, Privacy proof. Changed: rules typed in words (demo step 5) become three built-in rules the user switches on, which is the spec's own fallback; Ask (demo step 4) is a lookup that shows its source, built only if Phase 4 has time. Dropped: every P1 item, duplicate merging, calendar clash warnings, dark theme, real blur.

**If a phase runs late,** cut in this order: Ask, onboarding beyond the permission step, activity log undo, offline queue recheck (queued replies are then marked "needs you"). Never cut: capture, extraction, Today with sources, drafts with approval, Privacy proof.

---

## Lanes and File Ownership

Two lanes with separate folders, so the two developers almost never edit the same file. **Edit only files in your lane.**

| | Lane A: native and model | Lane B: app logic and screens |
| :--- | :--- | :--- |
| **Owner** | Steve (has the Infinix) | Ronmar |
| **Owns** | `mobile/android/**` · `mobile/src/services/native/**` · `mobile/src/services/model/**` · `mobile/package.json` · `mobile/package-lock.json` | `mobile/src/core/**` · `mobile/src/services/db/**` · `mobile/src/services/intake/**` · `mobile/src/services/actions/**` · `mobile/src/services/fakes/**` · `mobile/src/theme/**` · `mobile/src/components/**` · `mobile/src/screens/**` · `mobile/__tests__/**` |
| **Checks on** | The Infinix | Unit tests and fixture messages; the phone only at integration |

**Shared files, and the rule for each**

| File | Rule |
| :--- | :--- |
| `mobile/src/core/types.ts`, `mobile/src/services/contracts.ts` | Written together in Phase 0, then frozen. A change is announced first and pushed as its own small commit. |
| `mobile/src/services/index.ts` | Chooses the real or fake service. Created in Phase 0. Only Lane A edits it, once per integration (tasks A2.3 and A3.4). |
| `mobile/App.tsx`, `mobile/src/navigation.tsx` | Created in Phase 0 with all tabs and screens registered. Only Lane B edits them afterwards. |
| `mobile/package.json` and lockfile | Every library is installed in Phase 0. Afterwards only Lane A edits them; Lane B asks. |
| `.agents/sync/handoff.json`, `handoff.md` | Not tracked in git after Phase 0. The pre-commit hook rewrites them on every commit. |
| `docs/PLAN.md` | Tick only tasks in your own lane. Change other sections only when the other developer is not mid-edit. |

**Git habits**

1. One short branch per task: `steve/a2-1-listener`, `ronmar/b2-3-today`.
2. Before pushing: `git fetch && git rebase origin/main`.
3. Merge into `main` when a task's done-check passes, at least once an hour. Small merges conflict less.
4. Do not reformat, rename, or move files outside your lane.
5. No force pushes to `main`.

---

## Rules for Adding Features

1. **No Rogue Work:** When either developer (or their AI agent) wants to add an idea, log it below with Priority and initial status `[ ] Backlog`.
2. **Prioritization Tiers:**
   - **`P0` (Must-Have for Demo):** The core loop required for judges to understand and experience the product.
   - **`P1` (High Impact Polish):** Visual enhancers, seed data, and animations that elevate demo day.
   - **`P2` (Post-Hackathon Stretch):** Features that can wait until after judging.
3. **Lanes:** Each task belongs to Lane A or Lane B (see above). Tick a task off as soon as its done-check passes.
4. **Git Sync Cadence:** Rebase on `main` before starting a task; commit and push as soon as it is done (`git commit -m "feat: [feature name]"`).
5. **Tests first** for everything in `mobile/src/core/`, per [`docs/rules/`](rules/README.md). Verify with `npm run verify:agent`.

---

## P0: Must-Have for Demo

### Done

- [x] **Task 0.1: Workspace and React Native project initialised.** Priority: P0. Status: Done. React Native 0.87.1 (TypeScript) in `mobile/`, package `com.mira.app`, Android only.
- [x] **Task 0.2: Android toolchain on both machines.** Priority: P0. Status: Done. The scaffold app builds and runs on the Infinix; Ronmar's machine builds too.
- [x] **Task 0.3: Design spec approved; MIRA design in the agent workflow.** Priority: P0. Status: Done. Spec approved 2026-10-10. Design file, boards, and tokens in [`docs/design/`](design/README.md).

### Phase 0: Setup, together (T+0:00 to T+0:30)

Do these on one machine, in one sitting, as one or two commits. Both developers pull before starting Phase 1.

- [x] **Task P0.1: Stop tracking the handoff files**
  - **Priority:** P0 · **Status:** Done · **Lane:** A
  - **Files:** `.gitignore`, `.githooks/pre-commit`, `.agents/sync/handoff.json`, `.agents/sync/handoff.md`
  - **Do:** `git rm --cached` both files, add `.agents/sync/handoff.*` to `.gitignore`, remove the `git add .agents/sync/handoff.json` line from the hook.
  - **Done when:** a commit no longer changes anything under `.agents/sync/`.

- [ ] **Task P0.2: Install every library once**
  - **Priority:** P0 · **Status:** In Progress · **Lane:** A
  - **Files:** `mobile/package.json`, `mobile/package-lock.json`, `mobile/android/**` as the libraries require
  - **Do:** install `llama.rn`, `@op-engineering/op-sqlite`, `@react-navigation/native`, `@react-navigation/bottom-tabs`, `@react-navigation/native-stack`, `react-native-screens`, `react-native-linear-gradient`, `chrono-node`. Add the Onest font files under `mobile/android/app/src/main/assets/fonts/`. Do not install `react-native-paper` (the MIRA design replaces it) or `@notifee/react-native` (reminders are posted from Kotlin).
  - **Done when:** the app still builds and launches on the Infinix. If a library fails to build, apply its fallback from spec section 11 now, not later.
  - **State:** installed and passing type-check and unit tests: `llama.rn` 0.13.0-rc.7 (pinned; its `latest` tag is a release candidate), `op-sqlite` 18, React Navigation 7, `react-native-screens` 4, `react-native-linear-gradient` 2.8, `chrono-node` 2. Onest in five weights, used as `Onest-Light`, `Onest-Regular`, `Onest-Medium`, `Onest-SemiBold`, `Onest-Bold`. `MainActivity` overrides `onCreate` for `react-native-screens`. **Not yet built on the Infinix**: run `npm run android` from `mobile/` to finish this task.

- [x] **Task P0.3: Skeleton, shared types, and contracts**
  - **Priority:** P0 · **Status:** Done · **Lane:** both, written together
  - **Files:** `mobile/src/core/types.ts`, `mobile/src/services/contracts.ts`, `mobile/src/services/index.ts`, `mobile/src/services/fakes/`, `mobile/src/navigation.tsx`, `mobile/App.tsx`, one placeholder file per screen under `mobile/src/screens/`
  - **Do:**
    - `types.ts`: `CapturedNotification` (spec 4.1 fields), `Message`, `MiraRecord` (spec 5.2), `Rule` (spec 5.3), `Draft`, `Action`, `Channel`, `Decision`.
    - `contracts.ts`: `NativeBridge` (the methods in spec 4.2 without the two calendar methods, which belong to the dropped clash warnings, plus `scheduleReminder(title, at)`, `onNotification`, and `onOnlineChange`) and `ModelService` (`extract`, `draftReply`).
    - `fakes/`: a fake bridge that replays fixture notifications and a fake model that returns canned records, so Lane B needs no phone.
    - `index.ts`: exports the fakes for now.
    - `navigation.tsx`: bottom bar with Today, Ask, Approvals, Rules; a stack with Item detail, Channels, Activity log, Privacy proof, Onboarding. Each screen file renders its own name.
  - **Done when:** `npm run verify:agent` passes and the four tabs open on the Infinix.

### Phase 1: Prove the risky parts (T+0:30 to T+2:30)

**Lane A**

- [ ] **Task A1.1: A model answers on the phone**
  - **Priority:** P0 · **Status:** Backlog
  - **Files:** `mobile/src/services/model/llama.ts`, a developer-only screen under `mobile/src/services/model/dev/`
  - **Do:** download one instruct model of about 1 to 2B parameters in GGUF, 4-bit (candidates to try: Qwen2.5 1.5B Instruct, Gemma 3 1B). Copy it to the phone with `adb push`. Load it with `llama.rn` and run one prompt.
  - **Done when:** the phone prints an answer and the time taken. Record the model name and seconds per message in this task. Try a 3 to 4B model only if the small one is well under 6 seconds.
  - **If it fails:** stop and rethink together (spec section 12).

- [ ] **Task A1.2: Log real notifications**
  - **Priority:** P0 · **Status:** Backlog
  - **Files:** `mobile/android/app/src/main/java/com/mira/app/notifications/MiraNotificationListener.kt`, `mobile/android/app/src/main/AndroidManifest.xml`
  - **Do:** a `NotificationListenerService` that logs the spec 4.1 fields. Send real Messenger and Gmail messages to the phone.
  - **Done when:** this task records, for each app: how much text is exposed, whether the chat name is present, whether individual messages are listed, and whether a reply box is offered. Remove message text from logs before merging.

- [ ] **Task A1.3: Reply through a notification, and the bytes-sent count**
  - **Priority:** P0 · **Status:** Backlog
  - **Files:** the listener, plus a temporary test call
  - **Do:** send one reply through Messenger's notification reply box from a test build. Try reading the app's own bytes-sent count from Android.
  - **Done when:** this task records "reply works" or "use clipboard fallback", and "bytes count available" or "permission check only".

**Lane B**

- [ ] **Task B1.1: Fixture messages**
  - **Priority:** P0 · **Status:** Backlog
  - **Files:** `mobile/src/core/__fixtures__/messages.ts`
  - **Do:** about 30 messages for the student scenario with the expected type and key fields: announcements, a payment reminder, questions, promotions, short chatter, English mixed with the local language, and three hostile messages that try to give instructions.
  - **Done when:** the file type-checks against `CapturedNotification` and `MiraRecord`.

- [ ] **Task B1.2: Quick filter and verifier**
  - **Priority:** P0 · **Status:** Backlog
  - **Files:** `mobile/src/core/filter.ts`, `mobile/src/core/verify.ts`, `mobile/src/core/dates.ts`, tests beside each
  - **Do:** spec 4.4 and 4.6, tests first. Dates resolved by `chrono-node` relative to the post time.
  - **Done when:** tests cover each filter class, copied-field clearing, an unresolvable date phrase, and malformed model output.

- [ ] **Task B1.3: Storage**
  - **Priority:** P0 · **Status:** Backlog
  - **Files:** `mobile/src/services/db/schema.ts`, `mobile/src/services/db/index.ts`, query hooks in `mobile/src/services/db/hooks.ts`
  - **Do:** the tables in spec 5.1 except `memory` and `chats.enabled`; writes in transactions; one query hook per screen need.
  - **Done when:** a message and its record can be written and read back on the phone or an emulator.

- [ ] **Task B1.4: Theme tokens and first components**
  - **Priority:** P0 · **Status:** Backlog
  - **Files:** `mobile/src/theme/tokens.ts`, `mobile/src/components/SilkBackground.tsx`, `GlassCard.tsx`, `PillButton.tsx`, `StatusLabel.tsx`, `SourceQuote.tsx`, `TabBar.tsx`
  - **Do:** light-theme values from [`docs/design/README.md`](design/README.md) and board `00-foundations`. Glass is the translucent fill with the bright edge; no blur. `SourceQuote` shows the quoted original and the app and chat label (the source rule).
  - **Done when:** the tab shell shows the silk background and the floating tab bar, and no component contains a raw hex value.

**Phase 1 exit check:** every row of spec section 11 has an answer written into tasks A1.1 to A1.3.

### Phase 2: Core loop (T+2:30 to T+5:30)

**Lane A**

- [ ] **Task A2.1: Listener to app**
  - **Priority:** P0 · **Status:** Backlog
  - **Files:** `notifications/MiraNotificationListener.kt`, `notifications/NativeInbox.kt`, `MiraModule.kt`, `MiraPackage.kt`, `mobile/src/services/native/bridge.ts`
  - **Do:** drop notifications from switched-off apps before anything is stored (safety requirement 1). Store the rest in the native inbox and emit an event. Bridge methods: `isListenerEnabled`, `openListenerSettings`, `setEnabledPackages`, `listNotifyingApps`, `drainInbox`, `isOnline`.
  - **Done when:** `bridge.ts` implements `NativeBridge`, and a Messenger message arrives in JavaScript as a `CapturedNotification`.

- [ ] **Task A2.2: Extraction**
  - **Priority:** P0 · **Status:** Backlog
  - **Files:** `mobile/src/services/model/prompts.ts`, `mobile/src/services/model/index.ts`
  - **Do:** `extract(message)` returning a `MiraRecord`, output constrained to the spec 5.2 JSON form, the message inside a marked data block. One request at a time.
  - **Done when:** the fixture set runs on the phone from the developer screen; record accuracy, parse failures, and seconds per message here. Target: correct type on 85% or more, 6 seconds or less.

- [ ] **Task A2.3: Switch to the real services**
  - **Priority:** P0 · **Status:** Backlog
  - **Files:** `mobile/src/services/index.ts`
  - **Do:** export the real bridge and model on a device; keep the fakes for tests.
  - **Done when:** the Phase 2 exit check passes.

**Lane B**

- [ ] **Task B2.1: Intake pipeline**
  - **Priority:** P0 · **Status:** Backlog
  - **Files:** `mobile/src/services/intake/index.ts`
  - **Do:** drain the inbox on launch, on return to the foreground, and on each event; split into messages; skip ones already stored; run filter → `extract` → verify → store. A record that fails twice is stored as `other` with status `failed`.
  - **Done when:** replaying the fixtures through the fake bridge fills the database, with tests for skipping a stored message and for the failed path.

- [ ] **Task B2.2: Report builder**
  - **Priority:** P0 · **Status:** Backlog
  - **Files:** `mobile/src/core/report.ts`, test beside it
  - **Do:** spec 4.10 sections: Needs you, Dates found, Announcements, Handled for you, Ignored (a count), Couldn't read. No duplicate merging, no clash check.
  - **Done when:** tests cover section membership and ordering.

- [ ] **Task B2.3: Today and Item detail**
  - **Priority:** P0 · **Status:** Backlog
  - **Files:** `mobile/src/screens/Today/`, `mobile/src/screens/ItemDetail/`, `mobile/src/components/ReportItem.tsx`
  - **Do:** build to boards `05-home` and `14-email-and-ai-reply`. Every line carries its `SourceQuote`. Empty state and placeholder rows while the model works.
  - **Done when:** fixture data renders on Today, and tapping a line opens the original message.

- [ ] **Task B2.4: Channels**
  - **Priority:** P0 · **Status:** Backlog
  - **Files:** `mobile/src/screens/Channels/`
  - **Do:** build to board `19-connected-apps`. A switch per app and two levels (Read and report; Also draft replies). Each change calls `setEnabledPackages`.
  - **Done when:** switching an app off is stored and sent to the bridge.

**Phase 2 exit check:** with Gmail and Messenger on, send the phone an announcement, a payment reminder, a question, a promotion, and a message through a switched-off app. Today builds; the switched-off app's message is absent.

### Phase 3: Drafts, rules, privacy (T+5:30 to T+7:30)

**Lane A**

- [ ] **Task A3.1: Draft and send a reply**
  - **Priority:** P0 · **Status:** Backlog
  - **Files:** `mobile/src/services/model/index.ts`, `MiraModule.kt`, `mobile/src/services/native/bridge.ts`
  - **Do:** `draftReply(message)`, at most 60 words. `sendReply(key, text)` returning `sent` or `gone`; the listener keeps reply handles by notification key. If A1.3 found replies do not work, `sendReply` copies the text and opens the chat.
  - **Done when:** a reply typed in the app reaches Messenger from the phone.

- [ ] **Task A3.2: Reminders**
  - **Priority:** P0 · **Status:** Backlog
  - **Files:** `MiraModule.kt`, a small Kotlin alarm receiver, `bridge.ts`
  - **Do:** `scheduleReminder(title, at)` posts a local notification at the given time with `NotificationCompat`.
  - **Done when:** a reminder set one minute ahead appears on the phone.

- [ ] **Task A3.3: Release build with no internet permission, and proof facts**
  - **Priority:** P0 · **Status:** Backlog
  - **Files:** `mobile/android/app/src/main/AndroidManifest.xml`, `mobile/android/app/src/debug/AndroidManifest.xml`, `mobile/android/app/build.gradle`, `MiraModule.kt`
  - **Do:** move `INTERNET` to the debug manifest only. `getProofFacts()` returns whether the installed app holds the permission, and the bytes-sent count if A1.3 found it.
  - **Done when:** the release build's merged manifest has no `android.permission.INTERNET` (safety requirement 6) and the release app runs on the phone.

- [ ] **Task A3.4: Wire the new bridge methods**
  - **Priority:** P0 · **Status:** Backlog
  - **Files:** `mobile/src/services/index.ts`
  - **Done when:** the Phase 3 exit check passes on the phone.

**Lane B**

- [ ] **Task B3.1: Rule engine with hard limits**
  - **Priority:** P0 · **Status:** Backlog
  - **Files:** `mobile/src/core/rules.ts`, `mobile/src/core/builtinRules.ts`, tests beside them
  - **Do:** spec 4.8, tests first, one test per hard limit. Three built-in rules, off by default: remind me about deadlines and payments; draft replies to private questions; alert me on urgent messages.
  - **Done when:** all six hard-limit tests pass, including: sending is never `do`, and an instruction-like message produces no action and a log entry.

- [ ] **Task B3.2: Action runner and activity log**
  - **Priority:** P0 · **Status:** Backlog
  - **Files:** `mobile/src/services/actions/index.ts`, `mobile/src/screens/ActivityLog/`
  - **Do:** write every action to the `actions` table before it runs and update it with the result (safety requirement 8). Log screen to board `21-activity-history`, showing the rule and, for blocked actions, the reason.
  - **Done when:** a hostile fixture message shows in the log as blocked, with the reason.

- [ ] **Task B3.3: Rules screen**
  - **Priority:** P0 · **Status:** Backlog
  - **Files:** `mobile/src/screens/Rules/`
  - **Do:** build to board `12-my-automations`. The three built-in rules as switches, each with a plain-words description and a preview count of past messages it would have matched.
  - **Done when:** switching a rule on changes what the engine decides for the next message.

- [ ] **Task B3.4: Approvals**
  - **Priority:** P0 · **Status:** Backlog
  - **Files:** `mobile/src/screens/Approvals/`, `mobile/src/components/DraftCard.tsx`
  - **Do:** build to board `15-approval-center`. Each draft shows the original message, the draft (editable), and why it was prepared. Send needs a tap and then a confirmation dialog (safety requirement 2).
  - **Done when:** approving a draft calls `sendReply` and the action log records it.

- [ ] **Task B3.5: Privacy proof**
  - **Priority:** P0 · **Status:** Backlog
  - **Files:** `mobile/src/screens/PrivacyProof/`, `mobile/src/components/PrivacyIndicator.tsx`
  - **Do:** build to board `24-settings-and-privacy`. Show the facts from `getProofFacts()`, messages processed today, and average processing time. A debug build says "Development build: internet permission present."
  - **Done when:** the indicator in the top bar opens the screen and the facts are read live.

**Phase 3 exit check:** approve a draft and see it sent; send the hostile message and see nothing happen, with the log saying why; open Privacy proof on the release build.

### Phase 4: Offline and polish (T+7:30 to T+9:00)

**Lane A**

- [ ] **Task A4.1: Online state and airplane-mode run**
  - **Priority:** P0 · **Status:** Backlog
  - **Files:** `MiraModule.kt`, `bridge.ts`
  - **Do:** `isOnline()` and an online/offline event. Run the app in airplane mode: Today, drafting, and the model must work.
  - **Done when:** the app reports offline within a few seconds of airplane mode, and nothing breaks.

- [ ] **Task A4.2: Fix what the phone shows**
  - **Priority:** P0 · **Status:** Backlog
  - **Do:** run the whole demo script on the release build and fix native or model problems. Tune the prompt only against the fixture set.
  - **Done when:** demo steps 1 to 3 and 6 to 9 pass on the release build.

**Lane B**

- [ ] **Task B4.1: Offline queue**
  - **Priority:** P0 · **Status:** Backlog
  - **Files:** `mobile/src/core/queue.ts`, test beside it, `mobile/src/services/actions/index.ts`
  - **Do:** an approved reply while offline is stored as `queued`. On reconnect, recheck: the draft still exists, the notification is still showing, the channel still permits drafts. Send, or mark `needs you` and offer to copy the text and open the chat.
  - **Done when:** tests cover each recheck outcome, and the Approvals screen shows "Queued".

- [ ] **Task B4.2: Onboarding, permission step**
  - **Priority:** P0 · **Status:** Backlog
  - **Files:** `mobile/src/screens/Onboarding/`
  - **Do:** build to board `02-onboarding`. One screen explaining notification access, a button to the system setting, then Channels.
  - **Done when:** a fresh install reaches Today through onboarding.

- [ ] **Task B4.3: Visual pass**
  - **Priority:** P0 · **Status:** Backlog
  - **Do:** compare each built screen with its board. Check 48 dp touch targets, contrast, labels for the screen reader, system Back, and 130% font size.
  - **Done when:** each screen has been checked on the phone beside its board.

- [ ] **Task B4.4: Ask, lookup only (cut first if late)**
  - **Priority:** P0 · **Status:** Backlog
  - **Files:** `mobile/src/core/ask.ts`, test beside it, `mobile/src/screens/Ask/`
  - **Do:** keyword and date search over records; answer from a record field with its `SourceQuote`; "I couldn't find that in your messages" when nothing matches. No model call. If cut, hide the Ask tab.
  - **Done when:** "when is the deadline?" returns the deadline record and its source.

**Phase 4 exit check:** in airplane mode, Today and drafting work and an approved reply shows as queued; back online, it sends.

### Phase 5: Freeze and rehearse (T+9:00 to T+10:00)

No new features after T+9:00. Fixes only.

- [ ] **Task A5.1: Release build on the phone.** Priority: P0. Status: Backlog. Lane A. Install the final release build, with the model file in place. Done when the app starts from cold and passes Privacy proof.
- [ ] **Task B5.1: Demo messages and script.** Priority: P0. Status: Backlog. Lane B. Write the exact messages to send, in order, in `docs/demo-script.md`, including the hostile message. Done when a third person could run the demo from the file.
- [ ] **Task 5.2: Rehearse three times and record a backup.** Priority: P0. Status: Backlog. Both. Done when three full runs pass on the phone and a screen recording of one is saved.

---

## P1: High Impact Polish

Not in this window. Take one only if Phase 5 is finished early and everything above is solid.

- [ ] **Task 2.1: Rules typed in words, with preview**
  - **Priority:** P1
  - **Status:** Backlog
  - **Description:** `parseRule` turns a sentence into a rule, validated by code and previewed against past messages. Restores demo step 5 as written.

- [ ] **Task 2.2: Companion and dark theme**
  - **Priority:** P1
  - **Status:** Backlog
  - **Description:** Companion states (idle, listening, thinking, responding, offline) from board `00-orb-styles`; dark values from `05b-home-dark`; real blur on the tab bar and top bar.

- [ ] **Task 2.3: Ask with a model answer**
  - **Priority:** P1
  - **Status:** Backlog
  - **Description:** `planQuery` and an answer from the best five records, naming the one used.

- [ ] **Task 2.4: Duplicate merging and calendar clash warnings**
  - **Priority:** P1
  - **Status:** Backlog
  - **Description:** Spec 4.7 and the clash check in 4.10.

- [ ] **Task 2.5: Rules proposed from corrections, share an image in, catch-up brief, memory screen**
  - **Priority:** P1
  - **Status:** Backlog
  - **Description:** The remaining P1 items in spec section 1.5.

---

## P2: Post-Hackathon Stretch

- [ ] **Task 3.1: Automatic replies, shared rule sets, spoken brief, PDF export**
  - **Priority:** P2
  - **Status:** Backlog
  - **Description:** One automatic reply type under approved rules; rule sets shared as a file; spoken morning brief; scheduled reports and PDF export.
