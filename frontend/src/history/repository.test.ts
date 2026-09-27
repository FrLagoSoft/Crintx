import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TrackerRepository } from './repository.ts';
import { addItem, confirmRecovery, deleteHistory } from './domain.ts';

const item = { id: 'keys', displayName: 'Keys', deviceId: 'tag', aiEnabled: false, createdAt: 1 };
function memory() {
  let raw: string | null = null;
  return { getItem: async () => raw, setItem: async (_key: string, value: string) => { raw = value; } };
}
test('concurrent saves serialize, duplicate event remains one, restart preserves recovery', async () => {
  const storage = memory();
  const repo = new TrackerRepository(storage);
  await repo.load();
  await repo.update(d => addItem(d, item));
  const recovery = { id: 'one', itemId: item.id, confirmedAt: 2, provenance: 'user_confirmed' as const, searchSessionId: 'session', placeLabel: 'Desk' };
  await Promise.all([repo.update(d => confirmRecovery(d, recovery)), repo.update(d => confirmRecovery(d, { ...recovery, id: 'two' }))]);
  const restarted = new TrackerRepository(storage);
  assert.equal((await restarted.load()).recoveries.length, 1);
  await restarted.update(d => deleteHistory(d, item.id));
  assert.equal((await new TrackerRepository(storage).load()).recoveries.length, 0);
});
test('failed disk write does not publish data and does not poison following transactions', async () => {
  const storage = memory();
  let fail = true;
  const repo = new TrackerRepository({ ...storage, setItem: async (key, value) => {
    if (fail) throw new Error('Disk full');
    await storage.setItem(key, value);
  } });
  await repo.load();
  await assert.rejects(repo.update(d => addItem(d, item)), /Disk full/);
  assert.equal(repo.snapshot().items.length, 0);
  fail = false;
  await repo.update(d => addItem(d, item));
  assert.equal(repo.snapshot().items.length, 1);
});
test('unreadable storage is never overwritten by updates', async () => {
  let writes = 0;
  const repo = new TrackerRepository({ getItem: async () => '{broken', setItem: async () => { writes++; } });
  await assert.rejects(repo.load());
  await assert.rejects(repo.update(d => addItem(d, item)), /not ready/);
  assert.equal(writes, 0);
});
