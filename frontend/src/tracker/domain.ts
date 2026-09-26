/** Pure local tracker rules. BLE observations never imply a recovery place. */
export type Item = {
  id: string;
  displayName: string;
  deviceId: string;
  aiEnabled: boolean;
  createdAt: number;
};
export type Recovery = {
  id: string;
  itemId: string;
  confirmedAt: number;
  placeLabel?: string;
  provenance: 'user_confirmed';
  searchSessionId: string;
};
export type Sighting = { itemId: string; observedAt: number; rssi: number | null; source: 'ble' | 'simulated' };
export type TrackerData = { version: 1; items: Item[]; recoveries: Recovery[]; sightings: Sighting[] };
export const emptyData = (): TrackerData => ({ version: 1, items: [], recoveries: [], sightings: [] });
export const STALE_MS = 15_000;
export const MAX_SIGHTINGS = 200;
export const MAX_RECOVERIES = 1000;

/** Exponential smoothing for noisy RSSI; never convert this value to distance. */
export function smoothRssi(previous: number | null, sample: number | null): number | null {
  if (sample === null || !Number.isFinite(sample) || sample < -127 || sample > 20) return previous;
  return previous === null ? sample : Math.round(previous * 0.7 + sample * 0.3);
}

export function cleanLabel(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 80);
}

export function addItem(data: TrackerData, item: Item): TrackerData {
  if (!cleanLabel(item.displayName) || !item.deviceId) throw new Error('Choose a tracker and enter an item name.');
  if (data.items.some(i => i.deviceId === item.deviceId)) throw new Error('This tracker is already associated with an item.');
  return { ...data, items: [...data.items, { ...item, displayName: cleanLabel(item.displayName) }] };
}

export function confirmRecovery(data: TrackerData, recovery: Recovery): TrackerData {
  if (!data.items.some(i => i.id === recovery.itemId)) throw new Error('Item not found.');
  if (!recovery.searchSessionId) throw new Error('A search session is required.');
  if (data.recoveries.some(r => r.itemId === recovery.itemId && r.searchSessionId === recovery.searchSessionId)) return data;
  return { ...data, recoveries: [...data.recoveries, {
    ...recovery, placeLabel: cleanLabel(recovery.placeLabel ?? '') || undefined, provenance: 'user_confirmed' as const,
  }].slice(-MAX_RECOVERIES) };
}

export function recordSighting(data: TrackerData, sighting: Sighting): TrackerData {
  if (!data.items.some(i => i.id === sighting.itemId)) return data;
  // One latest observation per item, plus a bounded log sampled at most once per 30 seconds.
  const previous = [...data.sightings].reverse().find(s => s.itemId === sighting.itemId);
  const sightings = previous && Math.floor(sighting.observedAt / 30_000) === Math.floor(previous.observedAt / 30_000)
    ? data.sightings.filter(s => s !== previous) : data.sightings;
  return { ...data, sightings: [...sightings, sighting].slice(-MAX_SIGHTINGS) };
}

export function deleteHistory(data: TrackerData, itemId: string): TrackerData {
  return { ...data, recoveries: data.recoveries.filter(r => r.itemId !== itemId), sightings: data.sightings.filter(s => s.itemId !== itemId) };
}

export function setAiEnabled(data: TrackerData, itemId: string, enabled: boolean): TrackerData {
  return { ...data, items: data.items.map(i => i.id === itemId ? { ...i, aiEnabled: enabled } : i) };
}

export function isDetected(observedAt: number | undefined, now: number): boolean {
  return observedAt !== undefined && observedAt <= now && now - observedAt < STALE_MS;
}

export function summarize(data: TrackerData, itemId: string) {
  const recoveries = data.recoveries.filter(r => r.itemId === itemId).sort((a, b) => b.confirmedAt - a.confirmedAt);
  const counts = new Map<string, { label: string; count: number; latestAt: number }>();
  for (const r of recoveries) {
    if (!r.placeLabel) continue;
    const key = r.placeLabel.toLocaleLowerCase();
    const entry = counts.get(key);
    if (entry) entry.count++;
    else counts.set(key, { label: r.placeLabel, count: 1, latestAt: r.confirmedAt });
  }
  const places = [...counts.values()].sort((a, b) => b.count - a.count || b.latestAt - a.latestAt);
  return { recoveries, places, labeledCount: places.reduce((n, p) => n + p.count, 0), lastConfirmedRecovery: recoveries[0] ?? null };
}

export function suggestion(data: TrackerData, itemId: string): string {
  const { places, labeledCount } = summarize(data, itemId);
  if (!places.length) return 'No recovery places recorded yet. After you find this item, save where you found it.';
  const top = places[0];
  if (labeledCount === 1) return `You recorded one recovery at “${top.label}”. You could check there again. Its current location is unknown.`;
  return `You recorded ${top.count} of ${labeledCount} labeled recoveries at “${top.label}”. Check there first. Past recoveries do not establish its current location.`;
}

export function modelFacts(data: TrackerData, itemId: string, currentObservation: number | undefined, now: number) {
  const item = data.items.find(i => i.id === itemId);
  if (!item?.aiEnabled) throw new Error('AI analysis is disabled for this item.');
  const summary = summarize(data, itemId);
  // Keep the prompt within the small on-device context; expose the omitted count honestly.
  const modelPlaces = summary.places.slice(0, 5);
  const last = data.sightings.filter(s => s.itemId === itemId).sort((a, b) => b.observedAt - a.observedAt)[0];
  return {
    item: item.displayName,
    currently_detected: isDetected(currentObservation, now),
    last_detected_at: last ? new Date(last.observedAt).toISOString() : null,
    confirmed_recovery_counts: modelPlaces.map(p => ({ label: p.label, count: p.count })),
    other_labeled_recoveries: summary.labeledCount - modelPlaces.reduce((count, place) => count + place.count, 0),
    total_labeled_recoveries: summary.labeledCount,
    current_location: 'unknown',
  };
}

/** Fail closed on incompatible/corrupt storage, preserving the original bytes for recovery. */
export function parseData(raw: string | null): TrackerData {
  if (raw === null) return emptyData();
  const d = JSON.parse(raw) as TrackerData;
  const timestamp = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v >= 0;
  if (d.version !== 1 || !Array.isArray(d.items) || !Array.isArray(d.recoveries) || !Array.isArray(d.sightings)
    || !d.items.every(i => typeof i.id === 'string' && typeof i.displayName === 'string' && typeof i.deviceId === 'string' && typeof i.aiEnabled === 'boolean' && timestamp(i.createdAt))
    || !d.recoveries.every(r => typeof r.id === 'string' && typeof r.itemId === 'string' && typeof r.searchSessionId === 'string' && r.provenance === 'user_confirmed' && timestamp(r.confirmedAt) && (r.placeLabel === undefined || typeof r.placeLabel === 'string'))
    || !d.sightings.every(s => typeof s.itemId === 'string' && timestamp(s.observedAt) && ['ble', 'simulated'].includes(s.source) && (s.rssi === null || (typeof s.rssi === 'number' && Number.isFinite(s.rssi))))) {
    throw new Error('Local tracker data could not be read. Original data has been preserved; do not reinstall the app.');
  }
  return d;
}
