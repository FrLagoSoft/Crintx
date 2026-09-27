> Integration status (September 26, 2026): Tracker work is now layered onto origin/main at 66dd14e. Main's existing screens, firmware, BLE flow and AI test are retained. Open Setup → Open recovery history for the added local workflow. The strict offline manifest plugin is preserved but NOT enabled in this combined prototype: existing networking, GPS and model download remain available. App-wide offline/backup guarantees are therefore pending a separate integration decision. Regenerate native projects before building; old generated Android files and earlier export results are not evidence for this combined version.

# Verification evidence and remaining gates

The complete demo is **not verified**. Passing software checks do not establish physical behavior. See PROGRESS.md for the latest build status; this checklist records the scope of each check.

| Requirement | Evidence currently available | Remaining gate |
| --- | --- | --- |
| Preserve teammate work | Clean starting tree at `8f72a88`; theme, assets, boot flow and existing configuration retained; no reset/push/publish | Review final diff |
| Android app builds | Expo prebuild and initial Hermes production export passed; native build is underway | Successful release APK plus static APK inspection |
| Offline cold launch | Release config embeds JS, disables updates and removes Internet permission | Install APK; force-stop/relaunch with internet and Metro absent |
| Real tracker discovery | Foreground filtered BLE adapter implemented; permission errors, bounded search and lifecycle stop paths | Actual firmware service UUID, S24 and ESP32 |
| Honest stale detection | Boundary/future-time tests pass for 15-second expiry; RSSI smoothing test passes; no distance/room claims | Power off real tag and observe expiry |
| Ring actual buzzer | No guessed payload; firmware duration gate, connection timeout, write response wording and cancellation implemented | Firmware command/access controls; audible bounded ring and optional Stop |
| Recovery saved locally | Serialized repository tests cover persistence across a new repository instance, duplicate saves and write failure | Actual app restart on emulator, then S24 |
| Historical suggestions | Tests cover zero/one/multiple recoveries, skipped place and counts independent of BLE advertisements | UI check and representative wording review |
| AI opt-in per item | Prompt construction rejects disabled items; orchestration tests prevent submission or discard output during loading/generation/release | Native UI toggle during real generation |
| Delete history and derived information | Domain/repository tests verify deletion and restart; UI invalidates observation/output/input snapshots and cancels native work | UI deletion and restart; inspect no stale native output |
| Tracking works without AI | Deterministic summaries and tracker repository are independent of inference; error handling leaves them available | Native UI and real tracker exercise |
| On-device inference | llama.rn driver implemented; checksum-verified Qwen GGUF provisioned with license/provenance | Successful inference in APK, timings/memory/output quality on S24 |
| Model failures don't break app | Tests cover unavailable model, reset busy state and retry; UI keeps deterministic summary visible | Native missing/corrupt-model tests |
| Exact AI input visible | Facts captured at request time, instructions visible in Setup; top-five place counts plus omitted count | UI inspect against actual request |
| Privacy controls | No fetch/axios in new runtime code; old backend config unused; native logs disabled; backup/transfer rules and network permission removal configured | Verify final merged APK, native logs and OEM backup behavior |
| Simulator separate from real data | Separate storage key, explicit simulated source and permanent banner | Exercise UI; verify no real-history contamination |
| Reproducible handoff | Specification saved; build/demo, firmware handoff and progress documents; build and APK verifier scripts | Update exact artifact hashes and final results after build |
| Submission readiness | Supplied deadline and readiness target recorded; no entry submitted | Official hacker guide and final device rehearsal |

## Evidence locations

- `frontend/src/history/*.test.ts`: runnable software checks (`npm test`).
- `.cache/android-build*.log`: native build attempts and failures, ignored by Git.
- `.cache/build-corruption-repair.json`: inventory of a damaged AAR and eight generated objects repaired during daytime continuation.
- `artifacts/android-bundle`: first exported Hermes bundle; not an APK or launch proof.
- `artifacts/model/PROVENANCE.json` and `LICENSE`: staged model source, checksum and license.
- `artifacts/*.apk.verification.json`: generated only after the corresponding APK passes the static verifier.

Do not seed the real history to manufacture a demo pattern. Record real recoveries when hardware becomes available; use the simulation lab only with its visible label.
