# Onboarding Permission Step

## Goal

A fresh Android install explains why MIRA needs notification access, opens the system listener settings, rechecks access when the app returns, then leads through Connected Apps to Today.

## Scope

- Replace the visual-only onboarding carousel with the permission step from P0 task B4.2.
- Reuse the existing native bridge, MIRA tokens, glass surfaces, controls, and navigation helpers.
- Keep permission denial and native errors visible and retryable.
- Add no dependency, native code, account setup, cloud connection, or iOS-specific behavior.

## Acceptance

- On mount and foreground return, read `bridge.isListenerEnabled()` instead of assuming access.
- When access is absent, explain that MIRA reads only enabled apps and keeps processing on-device.
- The primary action calls `bridge.openListenerSettings()`; a separate check action supports devices that do not emit the expected foreground event.
- When access is present, the primary action opens Connected Apps.
- Connected Apps provides a clear `Continue to Today` action that resets onboarding history.
- Errors are announced, retain the current screen, and can be retried.
- All controls have descriptive labels and at least 48 dp touch height.

## Plan

- [x] RED: add a focused onboarding test for denied, settings, foreground recheck, granted navigation, and error states.
- [x] GREEN: implement the permission screen and Connected Apps completion action.
- [x] Run scoped Tier 2 verification, full Tier 2 verification, and changed-file checks.
- [x] Update `docs/PLAN.md` with exact evidence and remaining physical-device checks.
