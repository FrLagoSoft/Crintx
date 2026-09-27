import * as FileSystem from 'expo-file-system/legacy';
import { requireOptionalNativeModule } from 'expo';
import { MODEL_PATH as SHARED_MODEL_PATH, modelReady as sharedModelReady } from '../ai/model';
import { InferenceRunner, MODEL_INSTRUCTIONS } from './inference';
export { MODEL_INSTRUCTIONS } from './inference';
export type { ModelFacts, Explanation } from './inference';


export const MODEL_PATH = `${FileSystem.documentDirectory}tracker-model.gguf`;

async function availableModelPath(): Promise<string | null> {
  if ((await FileSystem.getInfoAsync(MODEL_PATH)).exists) return MODEL_PATH;
  return await sharedModelReady() ? SHARED_MODEL_PATH : null;
}

export async function hasModel() { return (await availableModelPath()) !== null; }

export function canImportModel() { return requireOptionalNativeModule('ExpoDocumentPicker') !== null; }

export async function importModel() {
  if (!canImportModel()) throw new Error('File import is not included in this build. Download the model from Local AI instead; the tracker can use that file.');
  // Loading the picker eagerly would crash older development builds at startup.
  const DocumentPicker = await import('expo-document-picker');
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
      const model = await availableModelPath();
      if (!model) throw new Error('Download the model from Local AI or import a GGUF in tracker Setup.');
      const { initLlama, toggleNativeLog } = await import('llama.rn');
      await toggleNativeLog(false);
      const context = await initLlama({ model, n_ctx: 2048, n_batch: 128, n_threads: 4, n_gpu_layers: 0, use_mlock: false });
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
