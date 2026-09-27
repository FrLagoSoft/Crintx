# Prototype compared with main

Review snapshot: origin/main bd42ae7. AI-Prototyping is based on 66dd14e, before main's subsequent redesign and backend updates. This branch is a reviewable prototype, not a completed integration with current main.

## Added features
- Recovery history entry in the older Setup screen; feature code under frontend/src/history and routes under frontend/app/recovery-history.
- Locally saved item associations, user-confirmed recoveries, optional reusable text place labels, timestamps, and bounded BLE sightings. Place labels are not mapped geographic regions.
- Counts and suggestions calculated by code; optional on-device explanations receive selected recorded facts. Per-item AI opt-in, cancellation and local history deletion.
- Separate simulation lab with visibly simulated records.
- Optional GGUF import; clients without the picker can reuse the model downloaded through the existing Local AI screen.
- Eighteen automated tracker tests, TypeScript check, repo-local Android setup/build scripts, and progress/verification documentation.

## Preserved from our baseline
Existing AI prompt screen, BLE/buzz screens, backend code and firmware are retained. The original AI chat is not connected to server location history. Strict offline manifest plugin is stored but disabled, preserving existing networking and location behavior.

## Main changes not yet incorporated
- Redesigned frontend and newer navigation.
- UTC API contract, local buzz-record-to-tag-name mapping, and API gates.
- New backend implementation/tests and MongoDB/deployment configuration updates.

A direct diff against main will show those newer files missing or older versions present. Those differences reflect the older baseline; they are not proposed rollbacks for a future PR. Merge current main and resolve integration before considering a PR.

## Verification limits
TypeScript and all 18 existing history tests passed after the rename. No new APK was built or deployed, and hardware behavior and the optional-picker/shared-model fallback have not been verified on a device. The BLE recovery-history adapter remains guarded pending protocol integration.
