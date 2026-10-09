# Feature Requirements & Scoping Standards

How a MIRA feature is specified before any code is written. The aim is to stop scope creep and unhandled states during a 24-hour build.

---

## Overview

Every feature is written down in [`docs/specs/`](../specs/) or as a task in [`docs/PLAN.md`](../PLAN.md) before implementation. It must say what the user gets, what is left out, and how each screen behaves when things go wrong or the phone is offline.

---

## Core Standards

### 1. Feature format

Each non-trivial feature states:

- **Problem:** one or two sentences on what the user cannot do today.
- **User:** who benefits. For the demo this is a university student.
- **In scope:** the capabilities being built.
- **Out of scope:** what is deliberately left for later.
- **Tier:** P0, P1, or out of scope, matching the spec.

### 2. Given / When / Then acceptance criteria

Write behaviour so it maps directly to a test.

```gherkin
Scenario: A message from a switched-off app is ignored
  Given Messenger is switched on and the shopping app is switched off
  When the shopping app posts a notification
  Then nothing is written to storage
  And the Today report does not change
```

```gherkin
Scenario: A reply is approved with no connection
  Given the phone is in airplane mode
  And a reply draft is waiting in Approvals
  When the user taps Send and confirms
  Then the reply is stored as queued
  And Today shows that one reply is queued
```

### 3. The five screen states

Every screen documents all five before it is built:

1. **Loading:** placeholder rows shaped like the content. No spinner in the middle of a screen, and no layout jump when content arrives.
2. **Empty:** says what will appear here and what the user can do next.
3. **Error:** says what went wrong in plain words and offers a way forward, such as retry or open the chat.
4. **Populated:** real content, with pressed and disabled states for every control.
5. **Offline:** works as normal for everything already on the phone. A quiet banner says so. Nothing is greyed out, because MIRA does not depend on a connection.

### 4. MIRA-specific requirements

Any feature that shows something MIRA produced must also state:

- **Source:** which stored message each line, answer, or draft links to.
- **Label:** how the user can tell MIRA's words from quoted originals.
- **Correction:** how the user fixes it if MIRA got it wrong.

Any feature that acts must state which permission level it needs and confirm it respects the hard limits in section 4.8 of the spec.

### 5. Definition of Done

- [ ] Every Given/When/Then scenario for logic in `mobile/src/core/` has a passing Jest test, written before the code.
- [ ] All five screen states are built and checked on the phone.
- [ ] Touch targets are at least 48 dp, text contrast is at least 4.5:1, and nothing clips at 130% font size.
- [ ] Type-checking and lint pass with no errors.
- [ ] `npm run verify:agent` passes.
- [ ] The task is ticked off in [`docs/PLAN.md`](../PLAN.md).

---

## Dos and Don'ts

| Do | Don't |
| :--- | :--- |
| **Do** list what is out of scope for every feature. | **Don't** assume edge cases can be worked out while coding. |
| **Do** write criteria that become test assertions. | **Don't** write vague requirements such as "make the report helpful". |
| **Do** specify the empty, error, and offline states before building the screen. | **Don't** leave a blank screen while the model is working. |
| **Do** state the source message for everything MIRA says. | **Don't** show a summary, answer, or draft the user cannot check. |
| **Do** check each feature against the Definition of Done. | **Don't** call a feature complete if it has only been run on an emulator. |
