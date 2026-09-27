import * as Location from 'expo-location';
import { api } from './api';
import { rememberTagName } from './tagNames';

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

/**
 * Records where the phone was when it buzzed `tagName`. Pass `fix` if you already have one.
 * The server doesn't store tag names yet, so we also remember id → name on the phone.
 */
export async function logBuzzLocation(tagName: string, fix?: Fix) {
  const f = fix ?? (await getCurrentFix());
  const saved = await api.trackLocation({
    latitude: f.latitude,
    longitude: f.longitude,
    timestamp: new Date().toISOString(), // UTC with Z: the server's Instant rejects zone-less times
    tagName,
  });
  await rememberTagName(saved.id, tagName).catch(() => {});
  return saved;
}

/** "25.76170° N, 80.19180° W" */
export function formatCoords({ latitude, longitude }: Coords): string {
  const lat = `${Math.abs(latitude).toFixed(5)}° ${latitude >= 0 ? 'N' : 'S'}`;
  const lng = `${Math.abs(longitude).toFixed(5)}° ${longitude >= 0 ? 'E' : 'W'}`;
  return `${lat}, ${lng}`;
}

// ---- Time -------------------------------------------------------------------

/**
 * Parses the server's timestamps. Instants arrive as "2026-09-27T01:36:18.713789900Z"
 * (up to 9 decimals, which JS Date can't always parse), so read the parts by hand.
 * A time with no zone at all (old server) is read as phone-local time.
 */
export function parseServerTime(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?(Z|[+-]\d{2}:?\d{2})?$/.exec(s.trim());
  if (!m) return null;
  const [, y, mo, d, h, mi, sec, frac, zone] = m;
  const ms = frac ? Number(frac.slice(0, 3).padEnd(3, '0')) : 0;
  if (!zone) return new Date(+y, +mo - 1, +d, +h, +mi, +sec, ms);
  const utc = Date.UTC(+y, +mo - 1, +d, +h, +mi, +sec, ms);
  if (zone === 'Z') return new Date(utc);
  const sign = zone[0] === '-' ? -1 : 1;
  const [oh, om] = [Number(zone.slice(1, 3)), Number(zone.slice(-2))];
  return new Date(utc - sign * (oh * 60 + om) * 60_000);
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
