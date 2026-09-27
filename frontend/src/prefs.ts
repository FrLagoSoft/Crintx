import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Levels } from './ble';

/** App settings that live on this phone (the tags keep their own copy of the levels). */
export type Prefs = {
  levels: Levels;
  narration: boolean;
  /** Auto-buzz interval in minutes; 0 = off. */
  autoMinutes: number;
};

const KEY = 'crintx.prefs';
export const DEFAULT_PREFS: Prefs = { levels: { buzzer: 100, motor: 100 }, narration: false, autoMinutes: 0 };

export async function loadPrefs(): Promise<Prefs> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

export async function savePrefs(prefs: Prefs) {
  await AsyncStorage.setItem(KEY, JSON.stringify(prefs));
}
