import { initLlama, type LlamaContext } from 'llama.rn';
import { MODEL_PATH } from './model';
import { completionMessages, type HistoryContext } from './historyContext';

let ctx: LlamaContext | null = null;
let loading: Promise<number> | null = null;
let generating = false;

/** Loads the model into memory once; later calls reuse it. Returns load time in ms (0 if already loaded). */
export async function loadModel(): Promise<number> {
  if (ctx) return 0;
  if (loading) return loading;
  loading = (async () => {
  const started = Date.now();
  // CPU only for now; GPU/NPU offload can come later once the basics are proven.
  ctx = await initLlama({ model: MODEL_PATH, n_ctx: 2048, n_threads: 4, n_gpu_layers: 0, use_mlock: false });
  return Date.now() - started;
  })();
  try { return await loading; } finally { loading = null; }
}

export const isLoaded = () => ctx !== null;

export type Answer = { text: string; ms: number; tokensPerSecond: number };

/** One prompt in, one answer out. No chat memory between questions. */
export async function ask(prompt: string, onToken?: (token: string) => void, history?: HistoryContext): Promise<Answer> {
  if (!ctx) throw new Error('Load the model first.');
  if (generating) throw new Error('The AI is finishing another answer. Try again in a moment.');
  generating = true;
  try {
  const started = Date.now();
  const res = await ctx.completion({
    messages: completionMessages(prompt, history),
    n_predict: 256,
    temperature: 0.2,
    stop: ['<|im_end|>', '<|endoftext|>'],
  }, data => onToken?.(data.token));
  return { text: res.text.trim(), ms: Date.now() - started, tokensPerSecond: res.timings?.predicted_per_second ?? 0 };
  } finally { generating = false; }
}

export async function stop() { await ctx?.stopCompletion(); }

export async function unloadModel() {
  if (generating || loading) throw new Error('Wait for the current AI request to finish before deleting the model.');
  const current = ctx;
  ctx = null;
  await current?.release();
}
