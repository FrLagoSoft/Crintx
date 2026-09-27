import test from 'node:test';
import assert from 'node:assert/strict';
import { BuzzHistoryStore, combineBuzzHistory } from './buzzHistoryStore.ts';

const point = (id: string) => ({ id, deviceId: 'phone', tagName: 'Keys', latitude: 25, longitude: -80, timestamp: '2026-09-27T12:00:00Z' });
test('real local buzzes survive restart and concurrent writes', async () => {
  let raw: string | null = null;
  const storage = { getItem: async () => raw, setItem: async (_key: string, value: string) => { raw = value; } };
  const store = new BuzzHistoryStore(storage);
  await Promise.all([store.save(point('a')), store.save(point('b'))]);
  assert.equal((await new BuzzHistoryStore(storage).list()).length, 2);
});
test('backend acknowledgement updates the local record without duplicating it', async () => {
  let raw: string | null = null;
  const store = new BuzzHistoryStore({ getItem: async () => raw, setItem: async (_k, v) => { raw = v; } });
  await store.save(point('a')); await store.save({ ...point('a'), backendId: 'remote-a' });
  const local = await store.list();
  assert.equal(local.length, 1);
  assert.equal(combineBuzzHistory(local, [point('remote-a'), point('remote-b')]).length, 2);
});
test('failed writes are reported and later writes can recover', async () => {
  let fail = true; let raw: string | null = null;
  const store = new BuzzHistoryStore({ getItem: async () => raw, setItem: async (_k, v) => { if (fail) throw new Error('disk full'); raw = v; } });
  await assert.rejects(store.save(point('a')), /disk full/);
  fail = false; await store.save(point('b'));
  assert.deepEqual((await store.list()).map(p => p.id), ['b']);
});
test('corrupted history is preserved instead of silently overwritten', async () => {
  let writes = 0;
  const store = new BuzzHistoryStore({ getItem: async () => 'broken', setItem: async () => { writes++; } });
  await assert.rejects(store.save(point('a'))); assert.equal(writes, 0);
});
