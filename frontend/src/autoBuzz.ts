import { useEffect, useRef, useState } from 'react';
import { buzz, type Tag } from './ble';
import { getCurrentFix, logBuzzLocation } from './location';

// Loaded defensively: if a dev build lacked the native module, auto-buzz still
// works and the screen may just dim, instead of the home screen crashing.
let keepAwake: typeof import('expo-keep-awake') | null = null;
try {
  keepAwake = require('expo-keep-awake');
} catch {
  keepAwake = null;
}

const KEEP_AWAKE_TAG = 'crintx-auto-buzz';
const RETRY_WHEN_BUSY_MS = 15_000;

export type AutoBuzzStatus = {
  nextAt: number | null; // epoch ms of the next auto-buzz; null = off
  last: string | null; // result of the latest round, for the status line
};

/**
 * Buzzes every tag from the last scan every `minutes` minutes (0 = off).
 *
 * Only runs while Crintx is open: phones pause app timers in the background,
 * and the Bluetooth library can't buzz from there. So while it's on, the
 * screen is kept awake. Successful auto-buzzes are saved locally when a location fix is available.
 */
export function useAutoBuzz(
  minutes: number,
  tags: Tag[],
  bleBusy: boolean,
  setBleBusy: (busy: boolean) => void
): AutoBuzzStatus {
  const [nextAt, setNextAt] = useState<number | null>(null);
  const [last, setLast] = useState<string | null>(null);

  // The timer outlives renders, so it reads the latest values through refs.
  const tagsRef = useRef(tags);
  const busyRef = useRef(bleBusy);
  tagsRef.current = tags;
  busyRef.current = bleBusy;

  useEffect(() => {
    if (!minutes) {
      setNextAt(null);
      return;
    }
    const interval = minutes * 60_000;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;

    const schedule = (ms: number) => {
      setNextAt(Date.now() + ms);
      timer = setTimeout(round, ms);
    };

    async function round() {
      if (stopped) return;
      if (busyRef.current) return schedule(RETRY_WHEN_BUSY_MS); // a scan or buzz is running; try shortly
      const list = tagsRef.current;
      if (!list.length) {
        setLast('Auto-buzz skipped: scan for tags first');
        return schedule(interval);
      }
      setBleBusy(true);
      let reached = 0;
      const reachedTags: Tag[] = [];
      for (const tag of list) {
        if (stopped) break;
        try {
          await buzz(tag.id);
          reached++;
          reachedTags.push(tag);
        } catch {
          // out of range or switched off; the status line reports it
        }
      }
      setBleBusy(false);
      let recorded = 0;
      if (reachedTags.length && !stopped) {
        try {
          const fix = await getCurrentFix();
          for (const tag of reachedTags) {
            await logBuzzLocation(tag.name, fix);
            recorded++;
          }
        } catch { /* Report missing location/history without calling a successful buzz a failure. */ }
      }
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLast(`Auto-buzzed ${reached}/${list.length} tag${list.length > 1 ? 's' : ''} at ${time}. Saved ${recorded} location records.`);
      if (!stopped) schedule(interval);
    }

    keepAwake?.activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {});
    schedule(interval);
    return () => {
      stopped = true;
      clearTimeout(timer);
      keepAwake?.deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
    };
  }, [minutes, setBleBusy]);

  return { nextAt, last };
}
