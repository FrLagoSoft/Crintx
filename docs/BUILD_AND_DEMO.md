> Integration status (September 26, 2026): Tracker work is now layered onto origin/main at 66dd14e. Main's existing screens, firmware, BLE flow and AI test are retained. Open Setup → Open recovery history for the added local workflow. The strict offline manifest plugin is preserved but NOT enabled in this combined prototype: existing networking, GPS and model download remain available. App-wide offline/backup guarantees are therefore pending a separate integration decision. Regenerate native projects before building; old generated Android files and earlier export results are not evidence for this combined version.

# Build and offline demonstration

## Current target and boundaries

Expo 57 / React Native 0.86.3; Android ARM64 (Samsung S24 reported by user). The repository keeps the team's theme, boot flow, assets, EAS config and dormant backend config. Runtime screens use the new local repository. No cloud account or API key is needed.

The user authorized free repo-local tools/dependencies/model downloads. No global installs, pushes, paid builds, publishing, board flashing or hackathon submission are part of this work.

## Software checks

From `frontend` with Node 24:

```powershell
npm ci --cache ..\.cache\npm --no-audit --no-fund
npm run typecheck
npm test
$env:EXPO_NO_TELEMETRY='1'
$env:EXPO_NO_DOTENV='1'
npm run bundle:android
```

Tests use Node's native TypeScript stripping and test runner. A harmless MODULE_TYPELESS_PACKAGE_JSON warning reflects the existing Expo CommonJS package configuration; no separate test runtime is required.

## Native build

Run from the repository root:

```powershell
# Fresh clone only: download and provision repo-local Android/JDK tools.
.\scripts\setup-android.ps1
# Once tools and frontend dependencies exist:
.\scripts\build-android.ps1
```

The setup script consolidates the official-download/checksum/installation steps used during development; a fresh-clone end-to-end run of that script still needs validation. It makes no permanent system PATH changes and requires network access for initial provisioning.

The script expects the locally provisioned tool directories:

- `.tooling/java/jdk-*`: Temurin JDK 17, SHA-256 checked against Adoptium metadata.
- `.tooling/android-sdk`: Android SDK platform 36, build tools 36.0.0, NDK 27.1.12297006 and CMake 3.22.1.
- `.tooling/android-tools/cmdline-tools/bin`: official Android command-line tools. The downloaded archive's SHA-1 matched Google's repository metadata.

Environment and caches are scoped to the build process/repository. Expo generates the ignored `frontend/android` folder. Configure native changes through `frontend/app.json` and `frontend/plugins/withOfflinePrivacy.js`; do not rely on manual changes to generated files.

Output is `artifacts/crintx-offline-arm64.apk` **only when the script succeeds**. It uses release bundling and the generated development signing key for local prototype installation. It is not a store-signed production distribution. Installing over a differently signed teammate APK may fail; do not uninstall and erase their data automatically.

The build uses the generic llama CPU fallback plus an optimized CPU variant (`rnllama_v8_2_dotprod_i8mm` on ARM64 or `rnllama_x86_64` for the emulator). The native loader selects a supported available variant. No cloud, GPU or DSP runtime is substituted. The dependency currently requires compilation from source.

After a successful build, inspect the actual APK:

```powershell
.\scripts\verify-apk.ps1 -ApkPath artifacts\crintx-offline-arm64.apk
```

The inspection checks embedded JavaScript, native llama libraries, absence of Internet permission and backup flags; it cannot prove runtime or hardware behavior. For an x86_64 emulator build, use `build-android.ps1 -SkipPrebuild -Architecture x86_64` after the ARM64 build finishes, and pass `-Architecture x86_64` to the APK verifier. Do not run both builds concurrently against the same generated project.

## Model provisioning

The downloaded candidate is `artifacts/model/qwen2.5-0.5b-instruct-q4_k_m.gguf` (491,400,032 bytes), from the official Qwen repository at revision `9217f5db79a29953eb74d5343926648285ec7e67`.

SHA-256: `74a4da8c9fdbcd15bd1f6d01d621410d31c6fc00986f5eb687824e7b93d7a9db`.

License and download metadata are alongside it in `artifacts/model/LICENSE` and `PROVENANCE.json`. This model is Apache-2.0 according to the [official model card](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF). The native integration uses [llama.rn](https://github.com/mybigday/llama.rn) 0.13.0-rc.6; this is a release candidate, and actual S24 compatibility/performance remains a physical validation step.

Copy the GGUF to the phone's Downloads folder during setup, open Setup → Import local GGUF model, and choose that file. The app copies it into private app storage and checks the GGUF header and size limit. It does not automatically download a model, use a laptop inference server, or call cloud AI. The original file in Downloads remains until the user removes it.

## Install when the phone is available and authorized

Enable USB debugging and accept the computer's authorization prompt on the unlocked S24. Verify the intended serial before installing:

```powershell
.\.tooling\android-sdk\platform-tools\adb.exe devices -l
# Replace PHONE_SERIAL with the authorized phone's serial:
.\.tooling\android-sdk\platform-tools\adb.exe -s PHONE_SERIAL install -r artifacts\crintx-offline-arm64.apk
.\.tooling\android-sdk\platform-tools\adb.exe -s PHONE_SERIAL push artifacts\model\qwen2.5-0.5b-instruct-q4_k_m.gguf /sdcard/Download/
```

Do not clear app data or uninstall an existing build to resolve signing issues without considering its saved records.

## Hardware protocol

Read `FIRMWARE_HANDOFF.md`. Supply the team's real firmware and populate `src/history/protocol.ts`; rebuild after configuration. Until then, real scanning gives an actionable setup error and Ring stays disabled. No simulated ring counts as a working buzzer.

## Rehearsal without hardware

Setup → Open simulation lab. The banner always says SIMULATED DATA. It has its own local storage key and emits `source: simulated` observations. No sample records are seeded into real history.

1. Simulate a detection and confirm a recovery at Desk.
2. Repeat Save within the same search: count remains one.
3. Start another simulated search and record another place or skip the place.
4. Restart the app and reopen simulation: confirm persistence.
5. Toggle AI, inspect supplied facts, test missing-model fallback, and cancel an in-flight request.
6. Delete simulation history; the suggestion must stop using prior places.

## Real offline demo (not certified until performed)

1. Launch the release APK and import the model before the demonstration.
2. Disable internet while leaving Bluetooth on. Stop Metro and cold-launch the app.
3. Discover the configured real ESP32, associate the item, detect and ring it. Listen for the actual buzzer and bounded stop.
4. Confirm Found it → Desk. Show the dated user-confirmed record.
5. Enable AI for that item, generate an explanation and inspect exact facts. Record loading and response timings, output and memory stability.
6. Disable AI while generating; verify output is discarded and ordinary tracking still works.
7. Delete the item's history. Confirm records, places, last detection and generated explanation disappear. A new search may create fresh sightings.
8. Repeat with no recoveries, one recovery, skipped places, model failure, Bluetooth off, permission denial and app backgrounding.

## Privacy scope

The release manifest removes Internet/network-state permissions, disables Android backup and excludes app data from cloud backup/device transfer. Native model logging is disabled. No analytics or crash-reporting SDK is added; unused location/notification modules are excluded from native autolinking. Verify the merged APK manifest after each material native configuration change.

History uses ordinary app-private AsyncStorage, not an independently encrypted vault. Delete removes application records and derived memory, not forensic remnants. Device/OS backups and OEM behavior still deserve physical testing. Model files and generated text are not sent to an AI service. Model loading/cancellation is cooperative: a native call may finish cleanup before another inference can begin, while tracking/history stay usable.

## Timing and event requirements

The supplied deadline is September 27, 2026, 11:00 a.m. EDT, with a 9:00 a.m. readiness target. At September 26, 6:40 a.m. EDT, these were about 28h20m and 26h20m away. The [official event interest page](https://interest.shellhacks.net/) confirms September 25–27, but the submission cutoff, earlier hacker-guide obligations and detailed sponsor prompts were not independently confirmed from accessible official search results. Provide the current hacker guide/submission page to check those requirements; no submission is authorized here.
