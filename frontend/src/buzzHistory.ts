import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';
import { BuzzHistoryStore, combineBuzzHistory } from './buzzHistoryStore';

// Buzzes are always saved on this phone first. With this false (the default now that the
// backend's MongoDB storage works), history also merges in the server's copy, e.g. after a
// reinstall; if the server is unreachable it falls back to the local copy.
// Set true to go back to local-only reads (e.g. if the backend breaks again).
export const USE_LOCAL_BUZZ_HISTORY = false;
export const buzzHistory = new BuzzHistoryStore(AsyncStorage);

export async function readBuzzHistory(limit = 50) {
  const local = await buzzHistory.list();
  if (USE_LOCAL_BUZZ_HISTORY) return local.slice(0, limit);
  try { return combineBuzzHistory(local, await api.locationHistory(limit)).slice(0, limit); }
  catch { return local.slice(0, limit); }
}
