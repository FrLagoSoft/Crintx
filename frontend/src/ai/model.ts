import * as FileSystem from 'expo-file-system/legacy'; // legacy API reports download progress

/** Qwen2.5 0.5B Instruct, 4-bit. Pinned revision so every phone gets the same file. */
export const MODEL_URL =
  'https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/9217f5db79a29953eb74d5343926648285ec7e67/qwen2.5-0.5b-instruct-q4_k_m.gguf';
export const MODEL_BYTES = 491_400_032;
export const MODEL_PATH = `${FileSystem.documentDirectory}qwen2.5-0.5b-q4_k_m.gguf`;
const PARTIAL_PATH = `${MODEL_PATH}.part`;

/** True only when the full file is on the phone; a half-finished download doesn't count. */
export async function modelReady() {
  const info = await FileSystem.getInfoAsync(MODEL_PATH);
  return info.exists && info.size === MODEL_BYTES;
}

/** Downloads to a .part file first, then renames, so a crash mid-download never looks "ready". */
export async function downloadModel(onProgress: (fraction: number) => void) {
  await FileSystem.deleteAsync(PARTIAL_PATH, { idempotent: true });
  const task = FileSystem.createDownloadResumable(MODEL_URL, PARTIAL_PATH, {}, p =>
    onProgress(p.totalBytesWritten / (p.totalBytesExpectedToWrite > 0 ? p.totalBytesExpectedToWrite : MODEL_BYTES)));
  const res = await task.downloadAsync();
  if (!res || res.status !== 200) throw new Error(`Download failed (HTTP ${res?.status ?? '?'}).`);
  const info = await FileSystem.getInfoAsync(PARTIAL_PATH);
  if (!info.exists || info.size !== MODEL_BYTES) {
    await FileSystem.deleteAsync(PARTIAL_PATH, { idempotent: true });
    throw new Error('Download was incomplete. Try again on Wi-Fi.');
  }
  await FileSystem.deleteAsync(MODEL_PATH, { idempotent: true });
  await FileSystem.moveAsync({ from: PARTIAL_PATH, to: MODEL_PATH });
}

export async function deleteModel() {
  await FileSystem.deleteAsync(MODEL_PATH, { idempotent: true });
  await FileSystem.deleteAsync(PARTIAL_PATH, { idempotent: true });
}
