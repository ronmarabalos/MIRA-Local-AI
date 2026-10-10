# On-Device Model Hardening — Implementation Plan

Spec: [2026-10-10-on-device-model-hardening.md](2026-10-10-on-device-model-hardening.md). Each step is test first (red), then code (green).

- [x] **1. Codes.** `core/modelErrors.ts`: `ModelError`, `MODEL_*` codes, `fromNative(code)`. Test: every native code maps; unknown codes map to the step's failure code.
- [x] **2. No fallback.** `createDeviceModel()` takes no stand-in. Tests: with no file, `extract`, `draftReply`, `answer`, `answerDocument` all reject with `MODEL_NOT_INSTALLED`; nothing fake is returned.
- [x] **3. Intake waits.** `MODEL_NOT_INSTALLED` from `extract` leaves the message `new` and ends the run. Test in `intake.test.ts`.
- [x] **4. Load guard, warm-up, reload.** Tests: two `warmUp()` calls load once; `reload()` unloads through the queue and the next call loads again; a failed load gives `MODEL_LOAD_FAILED` and is retried next time.
- [x] **5. Timeout.** `complete(..., { timeoutMs })` in `llama.ts`. Test with `llama.rn` mocked: a call past its limit calls `stopCompletion` and rejects `MODEL_TIMEOUT`; the queue carries on.
- [x] **6. Bounded input.** `messageBlock` cuts text to 1,500 characters. Test with a 10,000-character message, including an injection-shaped one.
- [x] **7. Status and download wrappers.** `modelStatus()`, `downloadModelFile`, `importModelFile` throw `ModelError`; download refuses with `MODEL_OFFLINE` when offline. Tests with the native module mocked.
- [x] **8. Kotlin.** `getModelStatus` (GGUF header), atomic `installModel`, `verifying` progress phase. Checked by build and on the phone.
- [x] **9. Manifest.** Remove datatransport's only upload backend (`CctBackendFactory`); its scheduler service and receiver stay, with nothing to send, so ML Kit cannot fail on start-up. Checked in the merged release manifest.
- [x] **10. Screen.** `MiraFilePanel` states and copy from spec section 4; Test MIRA (warm-up) shows loading, loaded, and load failure; accessibility label on the status. Tests in `model-setup.test.tsx`.
- [ ] **11. Verify.** `npm run verify:agent -- --tier 3`, release build, merged release manifest check, phone checks where possible.
