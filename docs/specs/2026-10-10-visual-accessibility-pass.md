# Visual and Accessibility Pass

## Goal

Validate the implemented MIRA screens against their design boards and close systemic accessibility gaps before the release rehearsal.

## Scope

- Audit the React Native screen set for 48 dp Android targets, accessible names and states, semantic token use, scroll/reflow behavior, motion preferences, and Back navigation.
- Apply only shared or clearly evidenced fixes; preserve the approved MIRA boards and feature scope.
- Inspect the connected Android build at normal and 130% font scale when the device is available for hands-on navigation.

## Evidence checklist

- [x] RED/GREEN regression test for the shared Android touch target.
- [x] Static audit: all `Tap` controls have accessible names.
- [x] Static audit: screen containers scroll/reflow and use safe-area insets.
- [x] Static audit: reduced-motion, semantic status text, and navigation helpers remain intact.
- [x] Full Baton verification and changed-file lint.
- [ ] Phone: compare built screens with boards at normal font size.
- [ ] Phone: verify system Back and 130% font size, then restore the original font scale.
- [x] Record exact evidence in `docs/PLAN.md`.
