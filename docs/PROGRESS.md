# AI history integration progress

## Temporary real-history storage — current status
- Backend storage is unavailable. Real manual and successful automatic buzzes with a location fix now save to AsyncStorage first, capped at 500 records. No demo seed data. Backend writes remain best-effort and never block local success; no automatic replay of failed uploads.
- Both Buzzer History and AI read the same local records. USE_LOCAL_BUZZ_HISTORY in frontend/src/buzzHistory.ts is the temporary switch until backend reads are fixed. Setting it false merges remote records with the local copy, deduplicating acknowledged backend IDs.
- Settings adds Give me a summary of my usage and an adjacent dropdown showing the grouped facts used. Existing AI screen/model download remain intact; only storage-related text was corrected.
- Source dropdown is populated when a summary is requested. Empty local history is explicit; old failed backend writes cannot be recovered automatically.
- TypeScript and 11 tests pass, including storage restart, concurrent saves, failed writes and duplicate acknowledgements. Device inference quality remains unverified.

## Earlier scope
User superseded the separate offline tracker specification: reuse main's working UI, BLE, server history and model. Remove redundant prototype flows and supply history as context to the existing AI. Full device behavior is not claimed verified.

## Implemented
- Existing AI Model screen now offers Summarize my history and history-aware typed questions. Uses the existing model and automatically loads it when needed.
- Existing Buzzer History links to that same AI screen. Main's BLE, buzz logging, auto-buzz, backend and native app configuration are unchanged.
- Reads up to 50 recent server records and existing local tag names. Deduplicates, validates and groups nearby same-tag points; code calculates counts. Sends at most five groups and discloses omitted records.
- Reuses existing place lookup for the leading group, falling back to coordinates. Buzz records are explicitly not confirmed finds or current item positions.
- History inclusion toggle, input snapshot inspection and cancellation/stale-output guards. Empty and unavailable history are handled distinctly.

## Removed
Separate Recovery history routes, provider/repository/BLE adapter, simulator, model importer, document-picker dependency, inactive privacy plugin, obsolete prototype scripts and superseded handoff documents. Old work remains in Git history; existing experimental phone data is not deleted or uploaded.

## Validation
- TypeScript check PASS.
- Seven context-pipeline tests PASS: tag-name joins, grouping, duplicates, invalid records, bounds, empty/server failure, address failure and excluded context. The former 18 prototype tests were removed with their obsolete implementation.
- Android Metro JavaScript export PASS (1,906 modules); this is not an APK or phone runtime test.
- Dependency lockfile matches main. No added native dependency or app-config change.

## Next physical check
On the existing development app, pull AI-Prototyping, run npm install and reload Metro. Open AI Model and press Summarize my history with real server records. Confirm supplied facts, generated answer and Stop behavior. Test empty history and unreachable server. Exact on-device quality/latency and hardware behavior remain unverified.
