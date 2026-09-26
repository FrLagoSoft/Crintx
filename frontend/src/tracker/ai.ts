import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import { InferenceRunner, MODEL_INSTRUCTIONS } from './inference';
export { MODEL_INSTRUCTIONS } from './inference';
export type { ModelFacts, Explanation } from './inference';


export const MODEL_PATH = `${FileSystem.documentDirectory}tracker-model.gguf`;

export async function hasModel() { return (await FileSystem.getInfoAsync(MODEL_PATH)).exists; }

export async function importModel() {
  const selection = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true, multiple: false });
  if (selection.canceled) return false;
  const asset = selection.assets[0];
  try {
    if (!asset.name.toLowerCase().endsWith('.gguf')) throw new Error('Choose a supported quantized GGUF model file.');
    if (asset.size && asset.size > 800_000_000) throw new Error('Use a small model under 800 MB for this demo.');
    const magic = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64, position: 0, length: 4 });
    if (magic !== 'R0dVRg==') throw new Error('The selected file does not have a GGUF header.');
    await FileSystem.copyAsync({ from: asset.uri, to: MODEL_PATH });
    return true;
  } finally {
    // The document picker created an app-cache copy; leave the user's source file alone.
    if (FileSystem.cacheDirectory && asset.uri.startsWith(FileSystem.cacheDirectory)) {
      await FileSystem.deleteAsync(asset.uri, { idempotent: true }).catch(() => {});
    }
  }
}

export class LocalInference extends InferenceRunner {
  constructor() {
    super(async () => {
      if (!await hasModel()) throw new Error('Import a GGUF model in Setup to enable on-device inference.');
      const { initLlama, toggleNativeLog } = await import('llama.rn');
      await toggleNativeLog(false);
      const context = await initLlama({ model: MODEL_PATH, n_ctx: 2048, n_batch: 128, n_threads: 4, n_gpu_layers: 0, use_mlock: false });
      return {
        complete: async facts => (await context.completion({
          messages: [{ role: 'system', content: MODEL_INSTRUCTIONS }, { role: 'user', content: JSON.stringify(facts) }],
          n_predict: 100, temperature: 0, stop: ['<|im_end|>', '<|endoftext|>'],
        })).text,
        stop: () => context.stopCompletion(),
        release: () => context.release(),
      };
    });
  }
}
