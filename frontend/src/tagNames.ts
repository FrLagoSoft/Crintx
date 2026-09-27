import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LocationPoint } from './api';

/**
 * The server stores lat/lng/time but not which tag was buzzed, so the phone
 * remembers point id → tag name for its own buzzes. History only ever shows
 * this phone's points (they're keyed by its build ID), so nothing is missing.
 * If the server starts returning `tagName`, that wins.
 */
const KEY = 'crintx.tagNames';
const MAX_ENTRIES = 500;

let cache: Record<string, string> | null = null;

export async function loadTagNames(): Promise<Record<string, string>> {
  if (!cache) {
    try {
      cache = JSON.parse((await AsyncStorage.getItem(KEY)) ?? '{}');
    } catch {
      cache = {};
    }
  }
  return cache!;
}

export async function rememberTagName(pointId: string, tagName: string) {
  const names = { ...(await loadTagNames()), [pointId]: tagName };
  const ids = Object.keys(names);
  for (const old of ids.slice(0, Math.max(0, ids.length - MAX_ENTRIES))) delete names[old]; // oldest first
  cache = names;
  await AsyncStorage.setItem(KEY, JSON.stringify(names));
}

/** The tag a point belongs to: the server's value, else what this phone remembered. */
export function tagNameFor(p: LocationPoint, names: Record<string, string>): string {
  return p.tagName ?? names[p.id] ?? 'Location';
}
