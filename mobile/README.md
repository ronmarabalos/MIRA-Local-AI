# MIRA mobile app

React Native 0.87 (TypeScript), **Android only**. There is no iOS project: MIRA reads other apps' notifications, which iOS does not allow (see spec section 2.1).

## Requirements

- Node 22.11 or newer
- JDK 17
- Android SDK (platform 37, build-tools 37.0.0, NDK 27.1.12297006, CMake 3.22.1, platform-tools)
- A phone with USB debugging on, or an emulator

## Run

```sh
npm install
npm start          # Metro, in one terminal
npm run android    # build and install, in another
```

Press <kbd>R</kbd> twice, or <kbd>Ctrl</kbd> + <kbd>M</kbd> for the dev menu, to reload.

## Check

From the repository root, `npm run verify:agent` type-checks and runs the unit tests. Inside this folder, `npm run typecheck` and `npm test` do the same by hand.

## Layout

- `android/`: the native project and the Kotlin bridge.
- `src/`: app code (`screens/`, `components/`, `theme/`, `services/`, `core/`). See [`docs/rules/frontend.md`](../docs/rules/frontend.md) and the visual design in [`docs/design/`](../docs/design/README.md).
- `__tests__/`: unit tests.
