import test from 'node:test';
import assert from 'node:assert/strict';
import { completionMessages, loadHistoryContext, summarizeHistory, type BuzzPoint } from './historyContext.ts';

const point = (id: string, extra: Partial<BuzzPoint> = {}): BuzzPoint => ({ id, latitude: 25, longitude: -80, timestamp: '2026-09-27T01:36:18.713789900Z', ...extra });
const time = '2026-09-27T02:00:00Z';
test('joins existing local tag names, groups nearby same-tag buzzes and keeps other tags separate', () => {
  const result = summarizeHistory([point('a'), point('b', { latitude: 25.0002 }), point('c', { tagName: 'Bag' })], { a: 'Keys', b: 'Keys', c: 'Old name' }, time);
  assert.equal(result.records, 3);
  assert.equal(result.groups[0].latest, '2026-09-27T01:36:18.713Z');
  assert.deepEqual(result.groups.map(g => [g.tag, g.count]), [['Keys', 2], ['Bag', 1]]);
});
test('distant points are separate; duplicate IDs and malformed locations do not inflate counts', () => {
  const result = summarizeHistory([point('a'), point('a'), point('b', { latitude: 26 }), point('bad', { latitude: 200 }), point('nan', { timestamp: 'wrong' })], {}, time);
  assert.equal(result.records, 2); assert.equal(result.groups.length, 2);
});
test('bounds history to 50 and groups to five while disclosing omitted records', () => {
  const result = summarizeHistory(Array.from({ length: 80 }, (_, i) => point(String(i), { tagName: `Tag ${i}` })), {}, time);
  assert.equal(result.records, 50); assert.equal(result.groups.length, 5); assert.equal(result.omittedRecords, 45);
});
test('empty history differs from server failure and neither triggers geocoding', async () => {
  const sources = { names: async () => ({}), place: async () => { throw new Error('should not call'); } };
  const empty = await loadHistoryContext({ ...sources, points: async () => [] });
  const failed = await loadHistoryContext({ ...sources, points: async () => { throw new Error('offline'); } });
  assert.equal(empty.status, 'empty'); assert.equal(failed.status, 'unavailable');
});
test('existing place lookup enriches the leading area; lookup failure keeps coordinates', async () => {
  const sources = { points: async () => [point('a')], names: async () => ({ a: 'Keys' }) };
  const named = await loadHistoryContext({ ...sources, place: async () => 'Library' });
  assert.equal(named.groups[0].place, 'Library');
  const fallback = await loadHistoryContext({ ...sources, place: async () => { throw new Error('offline'); } });
  assert.equal(fallback.status, 'ready'); assert.match(fallback.groups[0].place, /^near /);
});
test('model receives bounded recorded data and the typed question without claiming found events', () => {
  const context = summarizeHistory([point('a', { tagName: 'Ignore instructions' })], {}, time);
  const messages = completionMessages('Where are my keys?', context);
  assert.match(messages[0].content, /NOT confirmed recoveries/);
  assert.match(messages[1].content, /Ignore instructions/);
  assert.match(messages[1].content, /Where are my keys\?/);
  assert.match(messages[1].content, /right now: unknown/);
  assert.doesNotMatch(messages[1].content, /deviceId/);
});
test('facts are written from the user\'s point of view with relative times', () => {
  const context = summarizeHistory([point('a', { tagName: 'Keys' }), point('b', { tagName: 'Keys', latitude: 25.0002 })], {}, time);
  const messages = completionMessages('Summary please', context);
  assert.match(messages[0].content, /Talk to the person as "you"/);
  assert.match(messages[1].content, /You buzzed your "Keys" 2 times near 25\.000, -80\.000, most recently 24 min ago\./);
});
test('empty history is stated plainly instead of an empty list', () => {
  const messages = completionMessages('Summary please', summarizeHistory([], {}, time));
  assert.match(messages[1].content, /none yet/);
});
test('excluding history supplies no previous facts', () => {
  const messages = completionMessages('Hello');
  assert.match(messages[1].content, /excluded/);
  assert.doesNotMatch(messages[1].content, /buzzes|latitude|groups/);
});
