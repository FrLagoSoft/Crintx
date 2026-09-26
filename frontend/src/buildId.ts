import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';

/**
 * Anonymous per-install identity (no accounts). Generated once on first launch
 * and reused forever after, so the server can tell each phone apart.
 * Send it on every request as the `X-Build-Id` header.
 */
const KEY = 'crintx.buildId';
let cached: Promise<string> | null = null;

export function getBuildId(): Promise<string> {
  cached ??= (async () => {
    const existing = await AsyncStorage.getItem(KEY);
    if (existing) return existing;
    const id = randomUUID();
    await AsyncStorage.setItem(KEY, id);
    return id;
  })();
  return cached;
}

/** First block of the UUID, for showing on screen. */
export const shortId = (id: string) => id.split('-')[0].toUpperCase();
