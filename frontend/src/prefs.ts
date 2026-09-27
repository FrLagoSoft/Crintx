import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Levels } from './ble';

/** App settings that live on this phone (the tags keep their own copy of the levels). */
export type Prefs = { levels: Levels; narration: boolean };

const KEY = 'crintx.prefs';
const DEFAULTS: Prefs = { levels: { buzzer: 100, motor: 100 }, narration: false };

export async function loadPrefs(): Promise<Prefs> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export async function savePrefs(prefs: Prefs) {
  await AsyncStorage.setItem(KEY, JSON.stringify(prefs));
}
