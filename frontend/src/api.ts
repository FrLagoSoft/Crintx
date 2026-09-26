import { getBuildId } from './buildId';
import { API_URL } from './config';

/**
 * Every call to the Spring Boot server lives here. The server wraps responses
 * as { success, code, message, data }; request() unwraps `data` and turns
 * failures into ApiError with the server's own message.
 */

/** Mirrors LocationPointDTO on the server. Timestamps are zone-less local times. */
export type LocationPoint = {
  id: string;
  deviceId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  activityType?: string;
  timestamp: string;
  recordedAt?: string;
};

/** Mirrors LocationTrackRequestDTO. */
export type TrackLocation = {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  activityType?: string;
  timestamp?: string;
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
};
