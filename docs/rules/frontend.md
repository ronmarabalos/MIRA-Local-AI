# App Interface Standards (React Native)

Structure, state, components, accessibility, and performance rules for MIRA's screens. Visual direction comes from the MIRA design in [`docs/design/`](../design/README.md).

> **The design wins on visuals.** Where this file disagrees with the design on colour, type, surfaces, or component styling (the Material 3 kit in the Overview and section 3, and the palette, fonts, and "no gradients, glass or blur" line in section 5), follow the design. Structure, state, the source rule, accessibility, performance, and wording below still apply in full.

---

## Overview

MIRA's interface is React Native 0.87 in TypeScript, using **react-native-paper** for Material 3 components and **@react-navigation** for navigation. It should feel like a well-made Android app: standard controls, system Back working everywhere, and content that stays readable at large font sizes.

---

## Core Standards

### 1. Structure

- Code lives under `mobile/src/`: `screens/` (one folder per screen), `components/` (shared pieces), `theme/` (tokens), `services/` (model, database, native bridge), and `core/` (pure logic).
- **Screens contain no product logic.** They call `services/` and `core/` and render the result. Filtering, rule decisions, and report building belong in `core/`, where they can be tested without a phone.
- Navigation is a bottom bar with four destinations (Today, Ask, Approvals, Rules) and a stack for detail and settings screens.
- Function components and hooks only. Strict TypeScript; no `any`.

### 2. State

- **SQLite is the source of truth.** Screens read through query hooks and do not keep their own copy of stored data in component state.
- `useState` and `useReducer` are for transient interface state only: an open sheet, a text field, a selected filter.
- Shared interface state, such as the current channel filter or online status, goes in a small React context. No global state library unless a real need appears.
- After a write, re-run the affected query. Do not patch local copies by hand.

### 3. Components

- **Check `components/` and react-native-paper before writing anything new.** Buttons, switches, chips, dialogs, snackbars, and bottom sheets come from the kit.
- Do not build a custom control when a Material one exists. Do not use iPhone-style switches, dialogs, or navigation.
- Shared pieces built once and reused everywhere: report item with its quoted source, source label, level badge, privacy indicator, draft card, rule row.
- **Snackbars** confirm an action, with Undo where it can be reversed. **Bottom sheets** hold suggestions and choices. **Dialogs** are only for confirming a reply before it is sent.

### 4. The source rule

- Every line MIRA writes is followed by a quoted fragment of the original message and a source label naming the app and chat.
- MIRA's words and quoted originals use two distinct treatments, the same on every screen.
- Anything MIRA wrote carries a small text label saying so.
- Long messages are clamped to a few lines with a "Show all" control.

### 5. Theme and styling

- All colour, type, and spacing come from `theme/`. No raw hex values or one-off sizes in screens or components.
- Brand colour `#7665E8`, always flat. Deeper violet `#5847D1` for filled buttons and small violet text. Burnt orange `#C2410C` only for things that need the user. Green `#15803D` (light) and `#22C55E` (dark) only for privacy and on-device indicators.
- Type maps to Material roles (Headline, Title, Body, Label). Lexend for headlines and titles, Source Sans 3 for body and labels.
- Spacing follows a 4/8 dp rhythm.
- Light and dark themes are both complete. Never derive dark by inverting light.
- No gradients, glass or blur effects, decorative shadows, or emoji used as icons. One outlined icon family at one stroke weight.

### 6. Accessibility

- Touch targets at least 48 × 48 dp, with 8 dp between them.
- Body text contrast at least 4.5:1; large text and meaningful icons at least 3:1. Check both themes.
- Every control has an `accessibilityLabel` and the right `accessibilityRole`. Decorative icons are hidden from the screen reader.
- Colour is never the only signal. Badges, source labels, and the privacy indicator carry text.
- Layouts hold at 130% system font size and respect the status bar, navigation bar, and keyboard.
- System Back always does the expected thing.

### 7. Performance

- Lists use `FlatList` with stable keys. Never map a long array inside a `ScrollView`.
- The model never blocks the interface. While it works, show placeholder rows or the companion's thinking state.
- Do not start model work from a render. Start it from an event or an effect, and cancel it when the screen goes away.
- Motion is brief (150 to 250 ms) and only shows a change of state. Respect the system's reduced-motion setting.

### 8. Wording

- Plain and short. Buttons name their action. Errors say what went wrong and what to do next.
- When MIRA is unsure, it says so and offers a correction.
- No technical terms in the interface: no "model", "inference", "tokens", or "AI-powered".

---

## Dos and Don'ts

| Do | Don't |
| :--- | :--- |
| **Do** compose screens from `components/` and react-native-paper. | **Don't** hand-build buttons, dialogs, or switches. |
| **Do** read stored data through query hooks. | **Don't** copy database rows into `useState` and let them drift. |
| **Do** keep product logic in `core/` and `services/`. | **Don't** put filtering or rule decisions inside a screen. |
| **Do** take every colour and size from `theme/`. | **Don't** write raw hex values or arbitrary spacing in a component. |
| **Do** show the quoted source under everything MIRA says. | **Don't** show a summary or answer with no way to check it. |
| **Do** label controls for the screen reader and keep targets at 48 dp. | **Don't** rely on colour alone to show state. |
| **Do** show placeholder rows while the model works. | **Don't** freeze the screen or show a spinner over content. |
| **Do** design the offline state as fully working. | **Don't** grey out the app when there is no connection. |
