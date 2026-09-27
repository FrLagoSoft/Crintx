import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addItem, confirmRecovery, deleteHistory, emptyData, isDetected, modelFacts, parseData, recordSighting, setAiEnabled, smoothRssi, STALE_MS, suggestion, summarize } from './domain.ts';

const item = { id: 'keys', displayName: 'Keys', deviceId: 'device', aiEnabled: true, createdAt: 1000 };
const base = () => addItem(emptyData(), item);
const recovery = (session: string, placeLabel?: string) => ({ id: session, itemId: item.id, confirmedAt: 2000, placeLabel, provenance: 'user_confirmed' as const, searchSessionId: session });

test('zero and one recovery use appropriately limited language', () => {
  assert.match(suggestion(base(), item.id), /No recovery places/);
  const data = confirmRecovery(base(), recovery('one', 'Desk'));
  assert.match(suggestion(data, item.id), /one recovery/);
  assert.match(suggestion(data, item.id), /current location is unknown/);
});
test('counts come from recoveries, never advertisements; skip location is supported', () => {
  let data = base();
  for (let n = 0; n < 100; n++) data = recordSighting(data, { itemId: item.id, source: 'ble', observedAt: 3000 + n, rssi: -60 });
  assert.equal(summarize(data, item.id).labeledCount, 0);
  data = confirmRecovery(data, recovery('one', 'Desk'));
  data = confirmRecovery(data, recovery('two', 'desk'));
  data = confirmRecovery(data, recovery('three'));
  assert.equal(summarize(data, item.id).places[0].count, 2);
  assert.equal(summarize(data, item.id).recoveries.length, 3);
  assert.equal(summarize(data, item.id).labeledCount, 2);
});
test('double submission is idempotent even if recovery id changes', () => {
  const data = confirmRecovery(base(), recovery('same', 'Desk'));
  assert.equal(confirmRecovery(data, { ...recovery('same', 'Backpack'), id: 'different' }), data);
});
test('detection expires at exact boundary and future timestamps are not live', () => {
  assert.equal(isDetected(1000, 1000 + STALE_MS - 1), true);
  assert.equal(isDetected(1000, 1000 + STALE_MS), false);
  assert.equal(isDetected(undefined, 1000), false);
  assert.equal(isDetected(2000, 1000), false);
});
test('delete clears history and derived facts while preserving item and other history', () => {
  let data = confirmRecovery(base(), recovery('one', 'Desk'));
  data = recordSighting(data, { itemId: item.id, source: 'ble', observedAt: 3000, rssi: -60 });
  data = deleteHistory(data, item.id);
  assert.equal(data.items.length, 1);
  assert.deepEqual(modelFacts(data, item.id, undefined, 4000).confirmed_recovery_counts, []);
  assert.equal(modelFacts(data, item.id, undefined, 4000).last_detected_at, null);
});
test('AI disabled prevents prompt construction but preserves recovery and detection', () => {
  const data = setAiEnabled(confirmRecovery(base(), recovery('one', 'Desk')), item.id, false);
  assert.throws(() => modelFacts(data, item.id, undefined, 4000), /disabled/);
  assert.equal(summarize(data, item.id).labeledCount, 1);
  assert.equal(recordSighting(data, { itemId: item.id, source: 'ble', observedAt: 3000, rssi: -60 }).sightings.length, 1);
});
test('local serialization preserves recovery provenance; corrupted data fails closed', () => {
  const data = confirmRecovery(base(), recovery('one', 'Desk'));
  assert.deepEqual(parseData(JSON.stringify(data)), data);
  assert.throws(() => parseData('{"version":2}'), /preserved/);
  assert.throws(() => parseData('not json'));
});
test('sightings remain bounded', () => {
  let data = base();
  for (let n = 0; n < 500; n++) data = recordSighting(data, { itemId: item.id, source: 'ble', observedAt: 30_000 * n, rssi: -70 });
  assert.equal(data.sightings.length, 200);
});
test('RSSI smoothing reduces packet fluctuations without inventing distance', () => {
  assert.equal(smoothRssi(null, -70), -70);
  assert.equal(smoothRssi(-70, -50), -64);
  assert.equal(smoothRssi(-70, null), -70);
  assert.equal(smoothRssi(-70, 127), -70);
});
test('model input is bounded and reports recoveries omitted from its top places', () => {
  let data = base();
  for (let n = 0; n < 20; n++) data = confirmRecovery(data, recovery(`session-${n}`, `Place ${n}`));
  const facts = modelFacts(data, item.id, undefined, 4000);
  assert.equal(facts.confirmed_recovery_counts.length, 5);
  assert.equal(facts.total_labeled_recoveries, 20);
  assert.equal(facts.other_labeled_recoveries, 15);
  assert.equal(summarize(data, item.id).places.length, 20);
});
