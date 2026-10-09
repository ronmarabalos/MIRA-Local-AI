# On-Device Data, Model, Native & Security Standards

MIRA has no server. Its "backend" is everything on the phone beneath the screens: SQLite storage, the local model, the rule engine, the action runner, and the Kotlin bridge.

---

## Overview

These layers handle private messages and act on the user's behalf, so they must be predictable, testable, and safe by construction. The model is treated as an unreliable component whose output is always checked. Message text is treated as untrusted input.

---

## Core Standards

### 1. Validate at every boundary

- **Model output** is parsed and validated against the expected form before use. Fields copied from a message (date phrase, amount) must appear word for word in the message, or they are cleared.
- **Bridge payloads** from Kotlin are validated in TypeScript before they reach storage.
- **Rules** produced from a user's sentence are validated by code before they are shown for approval.
- Derive TypeScript types from the validators, so the type and the check cannot drift apart.
- Fail closed: an invalid record is stored as `failed` and listed under "Couldn't read". It never triggers an action.

### 2. Predictable results

- Functions in `core/` and `services/` that can fail return a result, `{ ok: true, value }` or `{ ok: false, reason }`. Exceptions are for programming errors, not expected failures.
- `reason` is a fixed code such as `MODEL_TIMEOUT`, `PARSE_FAILED`, `REPLY_GONE`, `NOT_PERMITTED`, or `DB_ERROR`. Screens turn codes into plain wording.
- Every action is written to the `actions` table before it runs and updated with its outcome, so the activity log is always complete.

### 3. Storage (SQLite)

- Parameterised queries only. Never build SQL by joining strings.
- Any change touching more than one row or table runs in a transaction.
- Index every column used to look up, join, or sort: `messages(package, posted_at)`, `records(type, date_at)`, `actions(status, created_at)`.
- Schema changes go through numbered migrations, applied at start-up.
- Queries that can return many rows take a limit. The report and log load in pages.
- Deleting an app's data removes its messages, records, drafts, and actions together, in one transaction.

### 4. The model

- **Structured output only.** Every call constrains the model to a fixed JSON form. The model never returns free text that is acted on.
- **Data block.** Message text goes inside a clearly marked data block, after fixed instructions that say the block is content to describe, never commands to follow.
- **No arithmetic or lookups.** The model copies date phrases; code converts them to dates. The model never computes totals or invents identifiers.
- **One request at a time,** in arrival order, with user-initiated requests moved to the front.
- **Timeouts.** A call that exceeds its limit is cancelled and recorded as failed, so one message cannot block the queue.
- **Prompts live in one place,** `mobile/src/services/model/prompts.ts`, and change only together with a run of the fixture set.

### 5. The rule engine and actions

- The rule engine is a pure function: same inputs, same decisions. It has no access to the model, storage, or the bridge.
- **The hard limits in section 4.8 of the spec are applied after every rule and are not configurable.** Each has its own unit test.
- Sending a reply always requires a tap on Send and a confirmation. No code path sends without one.
- A queued reply is rechecked against the draft, the notification, and the channel's permission before it is sent.

### 6. The Kotlin bridge

- Kotlin does only what JavaScript cannot: listening for notifications, holding reply handles, reading the calendar, and reading system facts.
- **No product logic in Kotlin.** No filtering by content, no rules, no model calls.
- A notification from an app that is switched off is dropped in the listener before anything is stored.
- Bridge methods are small, typed, and return plain data. Each failure maps to a fixed code.

### 7. Security and privacy

- **No internet in release.** The release build's merged manifest must not contain `android.permission.INTERNET`. Debug builds keep it for the development server.
- **No network libraries.** Do not add analytics, crash reporting, remote configuration, or any dependency that makes network calls.
- **Message text is untrusted.** It can never create or change a rule, choose a recipient, or alter a prompt's instructions.
- **No message content in logs.** Release builds log codes and identifiers only.
- **No secrets.** MIRA needs no keys or tokens. Never commit credentials; see [`varlock`](../../.agents/skills/varlock/SKILL.md) and review against [`owasp-security`](../../.agents/skills/owasp-security/SKILL.md).
- **Least permission.** Request only notification access, calendar read, and notifications. Each is requested when first needed, with a plain explanation.
- **The user can see and delete everything** MIRA has stored or learned.

---

## Dos and Don'ts

| Do | Don't |
| :--- | :--- |
| **Do** validate model output and bridge payloads before use. | **Don't** pass unparsed model text into storage or actions. |
| **Do** verify copied fields against the original message. | **Don't** trust a date or amount the model produced without checking. |
| **Do** return `{ ok, value }` or `{ ok, reason }` with fixed codes. | **Don't** throw for expected failures or return free-text errors. |
| **Do** wrap multi-row changes in a transaction. | **Don't** run related writes one by one with no rollback. |
| **Do** use parameterised queries. | **Don't** build SQL by joining strings. |
| **Do** keep the rule engine pure and its hard limits fixed. | **Don't** let a rule, a setting, or the model bypass a hard limit. |
| **Do** put message text inside the data block of a prompt. | **Don't** mix message text into a prompt's instructions. |
| **Do** keep Kotlin to capture, reply, calendar, and system facts. | **Don't** put filtering, rules, or model calls in native code. |
| **Do** check the release manifest for the internet permission. | **Don't** add any dependency that opens a network connection. |
| **Do** log codes and identifiers. | **Don't** log message content, sender names, or drafts. |
