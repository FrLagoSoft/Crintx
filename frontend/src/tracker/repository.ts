import { emptyData, parseData, type TrackerData } from './domain.ts';

export interface LocalStorage { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<void> }
export const STORAGE_KEY = 'crintx.offline-tracker.v1';

/** Serialize read-modify-write operations; publish only successfully persisted changes. */
export class TrackerRepository {
  private data = emptyData();
  private ready = false;
  private queue: Promise<unknown> = Promise.resolve();
  private storage: LocalStorage;
  private changed: (data: TrackerData) => void;
  constructor(storage: LocalStorage, changed: (data: TrackerData) => void = () => {}) { this.storage = storage; this.changed = changed; }
  async load() {
    this.data = parseData(await this.storage.getItem(STORAGE_KEY));
    this.ready = true;
    this.changed(this.data);
    return this.data;
  }
  snapshot() { return this.data; }
  update(change: (data: TrackerData) => TrackerData): Promise<TrackerData> {
    const task = this.queue.then(async () => {
      if (!this.ready) throw new Error('Local storage is not ready.');
      const next = change(this.data);
      if (next !== this.data) {
        await this.storage.setItem(STORAGE_KEY, JSON.stringify(next));
        this.data = next;
        this.changed(next);
      }
      return this.data;
    });
    this.queue = task.catch(() => {});
    return task;
  }
}
