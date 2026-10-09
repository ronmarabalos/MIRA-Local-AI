# MIRA Development Rules

This directory holds the working standards for building MIRA: an Android app in **React Native 0.87 (TypeScript)** with a **Kotlin** bridge, a **local language model**, and **SQLite** on the device. There is no server.

The design these rules serve is in [`docs/specs/2026-10-09-mira-design.md`](../specs/2026-10-09-mira-design.md). Where a rule and the spec disagree, the spec wins and the rule should be corrected.

---

## When to Read What

Load only the file that matches the task in hand.

| Task | Rule file | Covers |
| :--- | :--- | :--- |
| **Scoping a feature or writing acceptance criteria** | [`requirements.md`](requirements.md) | Feature format, Given/When/Then, the five screen states, Definition of Done |
| **Building screens, components, navigation, or styling** | [`frontend.md`](frontend.md) | React Native structure, state, components, theme tokens, accessibility, performance |
| **Anything visual: colour, type, surfaces, components, the companion** | [`docs/design/README.md`](../design/README.md) | The MIRA design file, its tokens, and which board matches which screen |
| **Working on storage, the model, the rule engine, the Kotlin bridge, or anything touching privacy** | [`backend.md`](backend.md) | On-device data, model input and output, native boundary, safety limits, security |
| **Testing approach, branching, or reviews** | [`docs/ai/workflows.md`](../ai/workflows.md) | Test-first cycle and review checklist |

The file names `frontend.md` and `backend.md` are kept from the project template. In MIRA, "frontend" means the app's screens and "backend" means the on-device data, model, and native layers.

---

## Principles

1. **Everything stays on the phone.** No code path sends message content off the device, and the release build has no internet permission.
2. **The model understands; code decides.** The model returns structured data. Whether anything happens is decided by ordinary code following rules the user approved.
3. **Every claim shows its source.** Anything MIRA tells the user links to the original message.
4. **Message text is untrusted data.** It can never create, change, or trigger a rule.
5. **Short and checkable.** These rules are written as principles and checklists. They are checked by [`tests/test_rules_integrity.py`](../../tests/test_rules_integrity.py).
