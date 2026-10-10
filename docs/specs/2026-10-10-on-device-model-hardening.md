# On-Device Model Hardening — Design Spec

- **Date:** 2026-10-10
- **Status:** Approved for build (requested by Ronmar)
- **Related:** [main spec](2026-10-09-mira-design.md) sections 4.5 and 9 · [backend rules](../rules/backend.md) section 4 and 7 · [roadmap](../PLAN.md) tasks B4.6 and B4.14

---

## 1. Decision

MIRA's inference stays entirely on the phone:

React Native screen → `ModelService` (`services/model/index.ts`) → `llama.rn` → `llama.cpp` → the Qwen2.5 1.5B Instruct Q4_K_M GGUF file in MIRA's own folder → the answer, on the phone.

No Open WebUI, no WebView, no local server, no remote or OpenAI-compatible provider. The internet is used for one thing: the model download the user starts (task B4.6). Nothing else opens a connection, and no message, draft, document, prompt, or output is ever sent.

## 2. Gap analysis (what already works is kept)

| Requirement | Before | Change |
|---|---|---|
| Installed-model detection | `getModelPath` checks the file exists | `getModelStatus` also checks the GGUF header: `missing`, `invalid`, or `installed` |
| Lazy load, no duplicate load | Lazy; serialised only because every call is queued | An explicit in-flight load guard; `warmUp()` through the queue |
| Replacement and reload | New file used after restart | `reload()` lets the old model go through the queue; the next request loads the new file |
| Typed failures | Free-text errors; lowercase native codes | `ModelError` with fixed `MODEL_*` codes (section 3) |
| No fabricated output | Answers and documents never fake; **reading and drafting fell back to the fake model** with no file | No fallback anywhere on a phone. Without a file, messages stay waiting and are read once the model is installed; drafts are logged as failed |
| Bounded context | Output capped; `n_ctx` 2048; **message text not capped** | Message text cut to 1,500 characters before it reaches the model |
| Timeouts | **None** (required by backend rules) | Each call has a limit; on expiry `stopCompletion()` is called and `MODEL_TIMEOUT` raised |
| Atomic install | **Deleted the old model, then renamed** | Rename over the old file in one step; on failure the old model stays and the part file is removed |
| Verifying, paused, offline states | Partly | Native progress carries a `verifying` phase; the screen shows paused, verifying, offline-before-install, and ready-offline |
| Telemetry | **ML Kit (OCR, task B4.13) brought Google's datatransport/Clearcut reporting** | Its only upload backend (`CctBackendFactory`) is removed in the main manifest; the scheduler stays with nothing to send |
| Chat template, temperature 0, one request at a time, user first, injection-safe data blocks, explicit download tap, progress, pause/resume, space and checksum checks | Already in place and tested | Unchanged |

## 3. Failure codes

`MODEL_NOT_INSTALLED`, `MODEL_DOWNLOAD_FAILED`, `MODEL_IMPORT_FAILED`, `MODEL_INVALID`, `MODEL_CHECKSUM_FAILED`, `MODEL_NO_SPACE`, `MODEL_LOAD_FAILED`, `MODEL_TIMEOUT`, `MODEL_CANCELLED`, `MODEL_BUSY`, plus `MODEL_OFFLINE` (download asked for with no connection). Native lowercase codes are mapped to these in one place (`core/modelErrors.ts`). Screens turn codes into words.

## 4. Screen states (MIRA on this phone, and setup step 2)

Missing · ready to download or add · downloading or adding with progress · paused (with bytes done) · verifying · installed and ready · loading (Test MIRA) · loaded (with seconds) · insufficient storage · invalid model · checksum failure · load failure · offline before installation · ready and offline.

Required copy, kept short: "MIRA runs on this phone." · "Install MIRA's file before MIRA can read and answer." · "Internet is only needed to download it." · "After that, MIRA works in airplane mode." · "Your messages never go to Open WebUI or any online AI."

## 5. Out of scope

Open WebUI or any server, a second inference library, remote providers, iOS, model choice changes, and Kotlin unit tests (the project has no Kotlin test setup; the native changes are checked by build, inspection, and on the phone).
