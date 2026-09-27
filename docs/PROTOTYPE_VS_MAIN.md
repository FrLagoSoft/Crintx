# Prototype compared with main

AI-Prototyping is rebased onto origin/main d56c2ad. Main's current UI, navigation, UTC API contract, local tag-name mapping, backend, firmware and deployment changes are retained.

## Additions
- Settings + AI now includes a Recovery history button opening the separate prototype screens.
- Local item associations, user-confirmed recoveries, optional reusable place labels and timestamps. Labels are text, not geographic regions.
- Code-calculated summaries and optional on-device explanations with per-item opt-in, cancellation and history deletion.
- Separate simulation lab, optional GGUF import, and reuse of the model downloaded through Local AI.
- Tests, build tools and progress/verification documentation.

Existing AI chat, server buzz history and GPS areas are not connected to the new recovery summaries yet. The prototype BLE adapter remains guarded pending protocol integration. The strict offline manifest plugin is retained but disabled.

## Checks
- TypeScript and all 18 history tests pass after rebase.
- Diff verifies backend, firmware, existing AI code, API/location helpers and app.json match main exactly.
- npm run android and npm run ios retain main's Metro behavior.
- Android JavaScript bundle check is recorded in PROGRESS.md. No new APK or physical testing is claimed.
