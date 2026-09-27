# Local AI with buzz history

Uses the existing AI Model screen and llama.rn runtime, model downloader, api.locationHistory(50), local tag-name mapping and describePlace lookup. No extra native dependencies or second BLE workflow.

## User flow
1. Open AI Model in Settings + AI, or Ask AI about my history in Buzzer History.
2. Download the existing model once if needed.
3. Press Summarize my history. This fetches recent history, loads the model if needed, and generates a short answer.
4. Typed questions include the same freshly fetched context when Include history in my questions is on. Turn it off for a general prompt. Show history used displays the supplied snapshot.

## Data path
Existing server records + saved tag names → validate/deduplicate → at most 50 recent records → group same-tag locations within approximately 100m of a representative point → top five groups with explicit omitted count → one existing address lookup for the leading area → compact facts + question → context.completion(). Counts are calculated in TypeScript, not by the model. No device/user identifiers are supplied to the model.

Records describe phone positions when buzzing; the app cannot infer a confirmed recovery, room, or current item position. This source has no user-named geographic areas. Unknown tag names stay unidentified; unavailable address names retain approximate coordinates. The sample is not lifetime history.

Empty server history yields an explicit no-records summary without invoking the model. Failed history retrieval is distinct and does not silently reuse stale data. General questions can run without history. History fetch uses the existing backend; the existing address lookup may use the OS geocoder or its existing online fallback. Inference is local. No new persistent history cache, recording workflow or automatic upload is added.

Stop, leaving the screen and backgrounding invalidate in-flight answers. Context snapshots and output are held only in memory. The existing model download remains managed by the original model module. Previously saved experimental recovery data is left untouched but is not read by this flow.

## Development
Run npm install and npx expo start --dev-client in frontend. Native dependencies and app configuration match main; no native rebuild is introduced by this integration. npm run typecheck and npm test check types and the pure context pipeline. Native performance and generated-answer quality still require testing on the installed app.
