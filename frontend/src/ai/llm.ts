import { initLlama, type LlamaContext } from 'llama.rn';
import { MODEL_PATH } from './model';
import { completionMessages, type HistoryContext } from './historyContext';

let ctx: LlamaContext | null = null;

/** Loads the model into memory once; later calls reuse it. Returns load time in ms (0 if already loaded). */
export async function loadModel() {
  if (ctx) return 0;
  const started = Date.now();
  // CPU only for now; GPU/NPU offload can come later once the basics are proven.
  ctx = await initLlama({ model: MODEL_PATH, n_ctx: 2048, n_threads: 4, n_gpu_layers: 0, use_mlock: false });
  return Date.now() - started;
}

export const isLoaded = () => ctx !== null;

export type Answer = { text: string; ms: number; tokensPerSecond: number };

/** One prompt in, one answer out. No chat memory between questions. */
export async function ask(prompt: string, onToken?: (token: string) => void, history?: HistoryContext): Promise<Answer> {
  if (!ctx) throw new Error('Load the model first.');
  const started = Date.now();
  const res = await ctx.completion({
    messages: completionMessages(prompt, history),
    n_predict: 256,
    temperature: 0.2,
    stop: ['<|im_end|>', '<|endoftext|>'],
  }, data => onToken?.(data.token));
  return { text: res.text.trim(), ms: Date.now() - started, tokensPerSecond: res.timings?.predicted_per_second ?? 0 };
}

export async function stop() { await ctx?.stopCompletion(); }

export async function unloadModel() {
  const current = ctx;
  ctx = null;
  await current?.release();
}
