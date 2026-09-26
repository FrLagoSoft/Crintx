import * as Location from 'expo-location';
import { api } from './api';

export type Coords = { latitude: number; longitude: number };
export type Fix = Coords & { accuracy?: number; altitude?: number; speed?: number };

export async function ensureLocationPermission() {
  const { granted } = await Location.requestForegroundPermissionsAsync();
  if (!granted) throw new Error('Location permission was denied. Allow it in Settings → Apps → Crintx.');
}

const toFix = ({ coords: c }: Location.LocationObject): Fix => ({
  latitude: c.latitude,
  longitude: c.longitude,
  accuracy: c.accuracy ?? undefined,
  altitude: c.altitude ?? undefined,
  speed: c.speed != null && c.speed >= 0 ? c.speed : undefined, // Android reports -1 for "unknown"
});

/** A fresh GPS fix, falling back to the last known one if the fresh one is slow. */
export async function getCurrentFix(): Promise<Fix> {
  await ensureLocationPermission();
  const fresh = Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  const timeout = new Promise<null>((r) => setTimeout(() => r(null), 8000));
  const pos = (await Promise.race([fresh, timeout])) ?? (await Location.getLastKnownPositionAsync());
  if (!pos) throw new Error('Couldn’t get a GPS fix. Try again outdoors or near a window.');
  return toFix(pos);
}

/** Calls onFix whenever the phone moves ~5 m. Returns a stop function. */
export async function watchFix(onFix: (fix: Fix) => void): Promise<() => void> {
  await ensureLocationPermission();
  const sub = await Location.watchPositionAsync(
    { accuracy: Location.Accuracy.High, distanceInterval: 5 },
    (pos) => onFix(toFix(pos))
  );
  return () => sub.remove();
}

// ---- Buzz logging -----------------------------------------------------------

const BUZZ_PREFIX = 'BUZZ:';

/** Records where the phone was when it buzzed `tagName`. Pass `fix` if you already have one. */
export async function logBuzzLocation(tagName: string, fix?: Fix) {
  const f = fix ?? (await getCurrentFix());
  return api.trackLocation({ ...f, activityType: BUZZ_PREFIX + tagName, timestamp: localTimestamp() });
}

/** "25.76170° N, 80.19180° W" */
export function formatCoords({ latitude, longitude }: Coords): string {
  const lat = `${Math.abs(latitude).toFixed(5)}° ${latitude >= 0 ? 'N' : 'S'}`;
  const lng = `${Math.abs(longitude).toFixed(5)}° ${longitude >= 0 ? 'E' : 'W'}`;
  return `${lat}, ${lng}`;
}

/** The tag name stored with a buzz point, if any. */
export const buzzTagName = (activityType?: string) =>
  activityType?.startsWith(BUZZ_PREFIX) ? activityType.slice(BUZZ_PREFIX.length) : undefined;

// ---- Time -------------------------------------------------------------------
// The server stores LocalDateTime (no time zone). We send the phone's local
// wall-clock time and read it back as local time, so it's right on the phone.

const pad = (n: number) => String(n).padStart(2, '0');

function localTimestamp(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** Parses "2026-09-26T14:03:11[.ffffff]" (or with a space) as local time. */
export function parseServerTime(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})/.exec(s);
  return m ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]) : null;
}

export function timeAgo(s: string): string {
  const d = parseServerTime(s);
  if (!d) return s;
  const sec = Math.max(0, Math.round((Date.now() - d.getTime()) / 1000));
  if (sec < 60) return 'just now';
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} h ago`;
  return d.toLocaleDateString();
}

// ---- Distance ---------------------------------------------------------------

/** Great-circle distance in meters (haversine). */
export function distanceMeters(a: Coords, b: Coords): number {
  const R = 6_371_000;
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLng = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatDistance(m: number): string {
  if (m < 10) return 'Right here';
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(m < 10_000 ? 1 : 0)} km`;
}

/** "Street 12, City, Country" for a point, or null if the phone's geocoder has nothing. */
export async function describePlace(c: Coords): Promise<string | null> {
  try {
    const [p] = await Location.reverseGeocodeAsync(c);
    if (!p) return null;
    return [p.name ?? p.street, p.city ?? p.subregion, p.country].filter(Boolean).join(', ') || null;
  } catch {
    return null;
  }
}
