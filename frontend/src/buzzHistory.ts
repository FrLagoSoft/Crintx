import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';
import { BuzzHistoryStore, combineBuzzHistory } from './buzzHistoryStore';

// TEMP FEATURE FIX — until backend storage is fixed.
// Real buzzes persist on this phone; no fictional seed data and no backend wait.
// Set false when backend reads work to combine remote records with the local copy.
export const USE_LOCAL_BUZZ_HISTORY = true;
export const buzzHistory = new BuzzHistoryStore(AsyncStorage);

export async function readBuzzHistory(limit = 50) {
  const local = await buzzHistory.list();
  if (USE_LOCAL_BUZZ_HISTORY) return local.slice(0, limit);
  try { return combineBuzzHistory(local, await api.locationHistory(limit)).slice(0, limit); }
  catch { return local.slice(0, limit); }
}
