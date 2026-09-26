# On-device AI — handoff for whoever builds it next

> **For an AI coding assistant reading this:** this file is the spec for the AI feature.
> Keep ALL AI code inside `frontend/src/ai/`. Other files get at most a one-line import
> (a route, a tab entry, a `<Component />`). Don't restructure the existing BLE, map,
> buzz or API code. It already works on the phone.

## Goal (keep it small)

A screen (or card) in the app where you can **type a question and a small language model
running on the phone answers it**, using the tag's buzz/location history as context.
Example: "Where do I usually lose my keys?" → "You buzzed Keys 4 times, 3 of them near
the same spot (last one yesterday 6:12 pm)."

It isn't meant to be a smart agent or anything complicated. It's one prompt in, a few sentences out.

## What the pieces are

| Thing | What it is |
|---|---|
| **llama.cpp** | A C++ program that runs language models on a CPU or phone. No server, no internet. |
| **llama.rn** | The React Native wrapper around llama.cpp (npm package `llama.rn`, repo `mybigday/llama.rn`). Gives JS `initLlama()` and `context.completion()`. *(Not "llama.rs". That's an unrelated Rust project.)* |
| **GGUF** | The file format llama.cpp loads. One file = the whole model. |
| **The model** | `Qwen2.5-0.5B-Instruct`, quantized `Q4_K_M`. About **491 MB**, Apache-2.0, small enough for a phone. |

Model download (pinned revision, direct link):
```
https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/9217f5db79a29953eb74d5343926648285ec7e67/qwen2.5-0.5b-instruct-q4_k_m.gguf
size:   491400032 bytes
sha256: 74a4da8c9fdbcd15bd1f6d01d621410d31c6fc00986f5eb687824e7b93d7a9db
```
**Never commit the .gguf file to git.** It's 491 MB.

## How the model gets onto the phone

**Recommended: the app downloads it itself, once.** Add a "Download AI model (491 MB)"
button. It saves the file into the app's private storage. After that everything is offline.
Nobody has to copy files around, and it survives app updates. It's only lost if the
app is uninstalled or its data is cleared.

```ts
// frontend/src/ai/model.ts
import * as FileSystem from 'expo-file-system/legacy';   // legacy API has download progress

export const MODEL_URL = 'https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/9217f5db79a29953eb74d5343926648285ec7e67/qwen2.5-0.5b-instruct-q4_k_m.gguf';
export const MODEL_BYTES = 491400032;
export const MODEL_PATH = FileSystem.documentDirectory + 'qwen2.5-0.5b-q4_k_m.gguf'; // already "file://..."

export async function modelReady() {
  const info = await FileSystem.getInfoAsync(MODEL_PATH);
  return info.exists && info.size === MODEL_BYTES;       // size check catches half-finished downloads
}

export async function downloadModel(onProgress: (fraction: number) => void) {
  const dl = FileSystem.createDownloadResumable(MODEL_URL, MODEL_PATH, {}, p =>
    onProgress(p.totalBytesWritten / (p.totalBytesExpectedToWrite || MODEL_BYTES)));
  await dl.downloadAsync();
  if (!(await modelReady())) throw new Error('Model download incomplete. Try again on Wi-Fi.');
}
```
Needs `npx expo install expo-file-system` (not in package.json yet).

**Dev shortcut (optional):** copy the file to the phone over USB into Downloads and pick it with
`expo-document-picker` → `FileSystem.copyAsync` to `MODEL_PATH`. The download button is simpler.

**Don't** bundle the model inside the APK. It makes the APK huge and slows every EAS build.

## Running it

```ts
// frontend/src/ai/llm.ts
import { initLlama, type LlamaContext } from 'llama.rn';
import { MODEL_PATH } from './model';

let ctx: LlamaContext | null = null;

async function getContext() {
  // Load once and reuse. Loading takes a few seconds; generating is faster.
  ctx ??= await initLlama({ model: MODEL_PATH, n_ctx: 2048, n_threads: 4, n_gpu_layers: 0 });
  return ctx;
}

export async function ask(question: string, context: string, onToken?: (t: string) => void) {
  const llm = await getContext();
  const res = await llm.completion({
    messages: [
      { role: 'system', content:
        'You help someone find their belongings. Answer in 1-3 short sentences using ONLY the data given. ' +
        'Past buzz locations are history, not where the item is now. If the data does not answer the question, say so.' },
      { role: 'user', content: `DATA:\n${context}\n\nQUESTION: ${question}` },
    ],
    n_predict: 150,
    temperature: 0.2,
    stop: ['<|im_end|>', '<|endoftext|>'],
  }, data => onToken?.(data.token));   // streams tokens so the UI shows text as it's written
  return res.text.trim();
}

export async function unload() { await ctx?.release(); ctx = null; }
```

## Feeding it the location data

The model is tiny. **Don't hand it raw lat/long numbers.** It can't do geometry. Do the math
in normal code first and give it a short plain-text summary:

```ts
// frontend/src/ai/summary.ts
import { buzzTagName } from '../location';
import type { LocationPoint } from '../api';

/** Turn buzz history into a few lines the model can actually use. */
export function summarize(points: LocationPoint[]): string {
  const buzzes = points.filter(p => buzzTagName(p.activityType));
  if (!buzzes.length) return 'No buzz history recorded yet.';
  // Group nearby points: rounding to 3 decimals ≈ 100 m grid.
  const spots = new Map<string, { tag: string; count: number; last: string }>();
  for (const p of buzzes) {
    const tag = buzzTagName(p.activityType)!;
    const key = `${tag}@${p.latitude.toFixed(3)},${p.longitude.toFixed(3)}`;
    const s = spots.get(key) ?? { tag, count: 0, last: p.timestamp };
    s.count++; if (p.timestamp > s.last) s.last = p.timestamp;
    spots.set(key, s);
  }
  return [...spots.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .map(([key, s], i) => `- ${s.tag}: buzzed ${s.count}x at spot #${i + 1} (${key.split('@')[1]}), last ${s.last}`)
    .join('\n');
}
```
Get the points from the existing `api.locationHistory(50)`. Nicer: let the user name a spot
("Home", "Library") and pass that name instead of coordinates. A 0.5B model handles labels much
better than numbers.

Note: `api.locationHistory` needs the Spring server. If the demo has to work with no internet,
also keep the last fetched history in AsyncStorage and summarize from that.

## UI

One screen, `frontend/src/ai/AskScreen.tsx`, exposed with a one-line route file
`frontend/app/ask.tsx` (`export { default } from '../src/ai/AskScreen';`) plus a tab/button to open it:

1. If `!modelReady()` → "Download AI model (491 MB)" button with a progress bar.
2. Otherwise → text box + "Ask" button + streamed answer.
3. A collapsible "What the AI saw" that shows the exact `summarize()` text. (Good for the
   privacy/sponsor pitch: everything visible and on-device.)

## Build steps (this is the part that trips people up)

llama.rn is **native code**, so a JS reload / Metro refresh is not enough. The app must be rebuilt.

1. `cd frontend && npx expo install llama.rn expo-file-system`
   *(Prior testing used `llama.rn@0.13.0-rc.6` with Expo 57 / RN 0.86. Pin that if the latest
   version fails to build.)*
2. Add the plugin to `app.json` → `expo.plugins`: `"llama.rn"`
   (use `["llama.rn", { "enableOpenCL": false }]` if the GPU option gives build trouble).
3. Rebuild the dev client: `eas build --profile development --platform android`,
   then install the new APK on the phone (the old dev build won't have llama.rn).
4. If minify/proguard is on, add to `android/app/proguard-rules.pro`:
   `-keep class com.rnllama.** { *; }`
5. `npx expo start`, open the app, tap Download, wait, ask a question.

## Checklist to call it "working"

- [ ] New dev build installs and the old features (BLE, buzz, map) still work.
- [ ] Model downloads, and the app still sees it after closing/reopening.
- [ ] A question gets an answer on the phone. Write down roughly how long load and answer take.
- [ ] Airplane mode on → asking still works (only the model part; the server history won't refresh).
- [ ] App doesn't crash if the model is missing or the download is interrupted.

## Out of scope for now

Cloud AI APIs, fine-tuning, embeddings/vector DB, chat history memory, multiple models,
GPU tuning. Add those only after the basic version works on the phone.
