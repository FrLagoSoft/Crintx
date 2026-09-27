import type { LocationPoint } from './api';

export type SavedBuzz = LocationPoint & { backendId?: string };
type Storage = { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<void> };
export const BUZZ_HISTORY_KEY = 'crintx.buzzHistory.v1';

/** Serializes writes so simultaneous buzzes cannot overwrite one another. */
export class BuzzHistoryStore {
  private pending: Promise<unknown> = Promise.resolve();
  private storage: Storage;
  constructor(storage: Storage) { this.storage = storage; }
  private async read(): Promise<SavedBuzz[]> {
    const raw = await this.storage.getItem(BUZZ_HISTORY_KEY);
    if (!raw) return [];
    const records: SavedBuzz[] = JSON.parse(raw);
    if (!Array.isArray(records) || records.some(p => !p || typeof p.id !== 'string' || typeof p.timestamp !== 'string'
      || !Number.isFinite(p.latitude) || !Number.isFinite(p.longitude))) throw new Error('Saved buzz history could not be read. Existing records have been preserved.');
    return records;
  }
  async list(): Promise<SavedBuzz[]> { await this.pending; return this.read(); }
  save(point: SavedBuzz): Promise<void> {
    const write = this.pending.then(async () => {
      const records = await this.read();
      const index = records.findIndex(p => p.id === point.id);
      if (index >= 0) records[index] = { ...records[index], ...point };
      else records.unshift(point);
      records.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      await this.storage.setItem(BUZZ_HISTORY_KEY, JSON.stringify(records.slice(0, 500)));
    });
    this.pending = write.catch(() => {});
    return write;
  }
}

export function combineBuzzHistory(local: SavedBuzz[], remote: LocationPoint[]) {
  const ids = new Set(local.flatMap(p => [p.id, ...(p.backendId ? [p.backendId] : [])]));
  return [...local, ...remote.filter(p => !ids.has(p.id))].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}
