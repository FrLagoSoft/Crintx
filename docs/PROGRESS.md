# Offline tracker progress

Goal active. Full demo is **not verified**.

## Prototype review shipment
- User authorized pushing the renamed recovery-history prototype for review. Current main inspected at bd42ae7; this branch remains based on 66dd14e.
- Newer main UI/API/backend changes are not merged. See PROTOTYPE_VS_MAIN.md for concrete additions and outstanding integration.
- TypeScript and all 18 tests passed after the rename. APK/device validation remains pending.

## Recovery history naming
- Renamed frontend/src/tracker to frontend/src/history and frontend/app/tracker to frontend/app/recovery-history, plus provider/controls and navigation labels.
- Storage keys and model filenames are unchanged so existing local records remain readable. Place labels are optional text attached to confirmed recoveries, not GPS regions.

## Metro compatibility audit
- Fetched main at 42aa5e6: redesign, UTC API contract and local tag names. Inspected, not merged.
- Main already declares the native capabilities for location/history/context; no new native module is needed for that bridge.
- Made picker loading optional and reused the Local AI download. No native configuration or dependency changes.
- TypeScript and 18 existing tests pass. Device compatibility remains unverified. See DEV_BUILD_COMPATIBILITY.md.

## Current integration status — September 26
- User requested gradual work on AI-Prototyping and explicitly authorized pushing this branch, without a PR or changes to main.
- Main baseline: 66dd14e. Original tracker snapshot preserved at f4e9979 on codex/offline-tracker-checkpoint-20260926.
- Tracker screens moved to /recovery-history, accessible from existing Setup. Main's screens, AI test, firmware and BLE implementation remain present.
- Main's application permissions/autolinking are retained to preserve its working GPS, networking and model download. The saved strict offline privacy plugin is not enabled in this combined prototype. Tracker-specific consent, local history and deletion remain implemented; no app-wide privacy guarantee is claimed.
- Firmware source is now present under firmware/. Reconcile it with the guarded tracker adapter in a later step, and confirm it matches the flashed board before claiming hardware success.
- The previous native build failed during JS/Hermes bundling with NTSTATUS 0xC0000005. No successful APK or device behavior is established. Earlier results below describe the pre-integration snapshot.
- Combined source checks: TypeScript PASS; all 18 tracker tests PASS; no conflict markers or whitespace errors. Android build and hardware verification remain pending.

## Earlier snapshot history (superseded where noted above)

## Daytime revalidation — September 26, 12:47 p.m. EDT
- Prior turn classified as progress: code, tests, Android prebuild/bundle and repo-local tool/model provisioning were completed.
- Previous build session handle is missing; process inventory confirms no running Java/native compiler/emulator process. No APK exists in artifacts or native APK outputs. The old log ends at native CMake compilation, without success or a terminal error. Cause of interruption is unknown.
- Resume the existing native build with `scripts/build-android.ps1 -SkipPrebuild`, logging to `.cache/android-build-resume.log`. Do not infer success from the old progress messages.
- No emulator UI or real-phone checks have passed yet. Physical phone and firmware integration remain pending.

## Implemented milestones
- Local serialized AsyncStorage repository, bounded sightings/recoveries, user-confirmed optional place labels, per-search duplicate prevention and deterministic count/recency summaries.
- Existing three-tab UI adapted for discovery/association, item detail, recovery confirmation, history, per-item AI opt-in and deletion.
- Foreground BLE service adapter with bounded scans, permissions, stale status and guarded ring path. UUIDs/payloads intentionally blank pending firmware; no guessed commands.
- llama.rn 0.13.0-rc.6 native integration, local GGUF import, fresh/released contexts, CPU settings, input inspection, timings, failure fallback and cancellation/discard semantics.
- Privacy: no runtime backend calls, AI defaults off, generated output only in memory, native model logs disabled, Android backup/transfer exclusions, release Internet permission removal.
- Repo-local JDK 17, Android SDK 36, NDK 27.1 and CMake provisioned. Reproducible build script added; native release build in progress.

## Latest check results
- `npm run typecheck`: PASS.
- `npm test`: PASS, 17 tests after daytime fixes (domain, RSSI smoothing, persistence failure/concurrency/restart, inference consent/cancellation/failure including cancellation during context release).
- Expo Android prebuild: PASS.
- Android Hermes production export: PASS (1872 modules in first export). Re-run needed after subsequent changes.
- APK build: resumed after confirmed interruption; session active. No APK yet and no physical-device claims.
- Emulator: dedicated Android 36 x86_64 AOSP device booted and reachable on isolated adb port 5038. App installation and UI checks pending APK.
- Initial sandbox npm network and Hermes execution restrictions resolved through automatic approval. No user intervention needed.
- Daytime native build diagnosed damaged prior build files: one Gradle AAR SHA-1 mismatch and eight zero-header native objects. Removed only those damaged files after verifying repo paths. Next attempt exposed zero-header Gradle transform locks; repairing generated cache state before another attempt. Logs and repair inventory are under `.cache/`.
- Fixed a ring lifecycle race: background/disconnect invalidates pending connection work; delayed cleanup is scoped to its original ring attempt.

## User-confirmed setup
- Samsung S24, OS believed current; phone will not be connected overnight. Exact Android version and RAM unverified.
- ESP32-WROOM-32E on generic DevKitC-style board, CP2102 USB serial. Working buzzer reported; triggering described uncertainly as receiving any signal. Firmware, UUIDs, ring payload, authentication and duration remain unknown.
- Inland Pro Micro is also available but is not the BLE tracker target.
- Free dependencies, build tools and model downloads into this repository authorized. No teammates editing this clone.
- No board flashing, global installation, paid services, push, publication or submission authorized/performed.

## Inspection — 2026-09-26
- Baseline: `8f72a88`; working tree clean before work. No AGENTS.md found in repository.
- Expo 57 / React Native 0.86 starter with three styled tabs, BLE dependency and AsyncStorage. Existing screens are placeholders; no firmware or BLE protocol in this clone.
- Preserve visual shell, boot identity and backend configuration; implement an independent local runtime.
- Node 24.13.1 and npm 11.8.0 available. No adb on PATH or SDK in default location. JAVA_HOME points to a JRE, not a confirmed JDK.
- Saved authoritative specification in OFFLINE_TRACKER_SPEC.md.

## Verification evidence
- Automated: 16 tests and type check pass; native prebuild and first Hermes production export pass. Native compilation still underway.
- Physical device: none. Phone authorization and ESP32 protocol pending.
- Simulated: isolated simulation lab implemented. No app UI exercise recorded yet.

## Blockers and exact next actions
- Phone: connect the S24 by USB, enable USB debugging, accept computer authorization and authorize installation/testing. Record exact Android version. The phone was unavailable overnight.
- ESP32: provide its current firmware sketch, or service/characteristic UUIDs and command/acknowledgement bytes; confirm bounded ring duration, supported access controls and buzzer wiring. Leave board powered nearby. No flashing authorized.
- Native release: build in progress, not a user-action blocker yet.
- Event: provide current hacker-guide/submission page to verify deadline and earlier requirements beyond the supplied specification.

## Work remaining (priority)
1. Finish native APK compilation and inspect merged privacy settings and embedded bundle.
2. Install emulator APK; exercise local workflow, restart, deletion, offline launch and real local model execution on simulated facts.
3. Integrate actual firmware protocol when supplied; verify on S24/ESP32 when available and authorized.
4. Audit final diff and verification scope; record remaining device tests and honest readiness.

## Required physical tests
Cold launch without Metro/internet; real discovery; disappearance/staleness; audible bounded ring; recovery after restart; actual inference timing/memory; disable AI during generation; delete history; background/foreground behavior.

Build/install instructions: `docs/BUILD_AND_DEMO.md`. Firmware integration: `docs/FIRMWARE_HANDOFF.md`. These are instructions, not evidence that physical checks passed.
