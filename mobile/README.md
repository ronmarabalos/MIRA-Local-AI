# MIRA mobile app

React Native 0.87 (TypeScript), **Android first**. The iOS project in `ios/` is kept for a later iPhone version; iOS does not let MIRA read other apps' notifications, so the demo runs on Android (see spec section 2.1).

## Requirements

- Node 22.11 or newer
- JDK 17
- Android SDK (platform 37, build-tools 37.0.0, NDK 27.1.12297006, CMake 3.22.1, platform-tools)
- A phone with USB debugging on, or an emulator
- iOS only: a Mac with Xcode, Ruby, and CocoaPods

## Run

```sh
npm install
npm start          # Metro, in one terminal
npm run android    # build and install, in another
```

On a Mac, for iOS: `bundle install`, then `cd ios && bundle exec pod install`, then `npm run ios`.

Press <kbd>R</kbd> twice, or <kbd>Ctrl</kbd> + <kbd>M</kbd> for the dev menu, to reload.

## Check

From the repository root, `npm run verify:agent` type-checks and runs the unit tests. Inside this folder, `npm run typecheck` and `npm test` do the same by hand.

## Layout

- `android/`: the native project and the Kotlin bridge.
- `ios/`: the iOS project, untouched scaffold until the iPhone version.
- `src/`: app code (`screens/`, `components/`, `theme/`, `services/`, `core/`). See [`docs/rules/frontend.md`](../docs/rules/frontend.md) and the visual design in [`docs/design/`](../docs/design/README.md).
- `__tests__/`: unit tests.
