import { getBuildId } from './buildId';
import { API_URL } from './config';

/**
 * Every call to the Spring Boot server lives here. The server wraps responses
 * as { success, code, message, data }; request() unwraps `data` and turns
 * failures into ApiError with the server's own message.
 */

/**
 * Mirrors LocationPointDTO on the server (feature/dev). Timestamps are UTC
 * instants, e.g. "2026-09-27T01:36:18.713789900Z".
 * `tagName` isn't stored by the server yet; see src/tagNames.ts.
 */
export type LocationPoint = {
  id: string;
  deviceId: string;
  userId?: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  recordedAt?: string;
  tagName?: string;
};

/**
 * Mirrors LocationTrackRequestDTO. The device ID goes in the X-Device-Id header,
 * not the body. `timestamp` must be UTC ISO (Date.toISOString()); a zone-less
 * time is rejected with 400. `tagName` is ignored until the server adds it.
 */
export type TrackLocation = {
  latitude: number;
  longitude: number;
  timestamp?: string;
  tagName?: string;
};

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

type Envelope<T> = { success: boolean; code?: string; message?: string; data?: T };

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Id': await getBuildId(),
        ...(init.headers ?? {}),
      },
    });
    const text = await res.text();
    let body: Envelope<T> | null = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      // not JSON (e.g. a proxy error page); fall through to the status check
    }
    if (!res.ok || body?.success === false) {
      throw new ApiError(res.status, body?.code ?? 'HTTP_ERROR', body?.message ?? `Server error (${res.status}).`);
    }
    // Enveloped responses carry `data`; a few endpoints (/api/test) return a bare object.
    return (body && 'data' in body ? body.data : body) as T;
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    if (err?.name === 'AbortError') throw new ApiError(0, 'TIMEOUT', 'The server took too long to answer.');
    throw new ApiError(0, 'NETWORK', `Can’t reach the server at ${API_URL}.`);
  } finally {
    clearTimeout(timer);
  }
}

const LOCATIONS = '/api/v1/locations';

export const api = {
  health: () => request<{ status: string }>('/api/test'),

  trackLocation: (point: TrackLocation) =>
    request<LocationPoint>(`${LOCATIONS}/track`, { method: 'POST', body: JSON.stringify(point) }),

  /** This phone's most recent point, or null if it hasn't logged one yet. */
  latestLocation: async (): Promise<LocationPoint | null> => {
    try {
      return await request<LocationPoint>(`${LOCATIONS}/${await getBuildId()}/latest`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return null;
      throw err;
    }
  },

  /** Newest first. */
  locationHistory: async (limit = 20) => {
    const res = await request<{ locations: LocationPoint[] }>(`${LOCATIONS}/${await getBuildId()}/history?limit=${limit}`);
    return res.locations;
  },

  /**
   * Text → speech via the server (ElevenLabs). Returns the MP3 as base64.
   * Sends the text both as a JSON body (Marcos's modules/tts endpoint, deployed on ECS)
   * and as ?text= (the older controller/TtsController), so either server version works.
   */
  speak: async (text: string): Promise<string> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);
    const clipped = text.slice(0, 500);
    try {
      const res = await fetch(`${API_URL}/api/tts/generate?text=${encodeURIComponent(clipped)}`, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json', 'X-Device-Id': await getBuildId() },
        body: JSON.stringify({ text: clipped }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new ApiError(res.status, body?.code ?? 'HTTP_ERROR', body?.message ?? `Narration failed (${res.status}).`);
      }
      return bytesToBase64(new Uint8Array(await res.arrayBuffer()));
    } catch (err: any) {
      if (err instanceof ApiError) throw err;
      if (err?.name === 'AbortError') throw new ApiError(0, 'TIMEOUT', 'The narrator took too long to answer.');
      throw new ApiError(0, 'NETWORK', `Can’t reach the server at ${API_URL}.`);
    } finally {
      clearTimeout(timer);
    }
  },
};

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Uint8Array → base64 (React Native has no Buffer). */
function bytesToBase64(bytes: Uint8Array): string {
  const out: string[] = [];
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i], b = bytes[i + 1] ?? 0, c = bytes[i + 2] ?? 0;
    const n = (a << 16) | (b << 8) | c;
    out.push(
      B64[(n >> 18) & 63] + B64[(n >> 12) & 63] +
      (i + 1 < bytes.length ? B64[(n >> 6) & 63] : '=') +
      (i + 2 < bytes.length ? B64[n & 63] : '=')
    );
  }
  return out.join('');
}
