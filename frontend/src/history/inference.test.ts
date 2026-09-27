import { test } from 'node:test';
import assert from 'node:assert/strict';
import { InferenceRunner, type InferenceContext, type ModelFacts } from './inference.ts';
const facts: ModelFacts = { item: 'Keys', currently_detected: false, last_detected_at: null, confirmed_recovery_counts: [{ label: 'Desk', count: 1 }], other_labeled_recoveries: 0, total_labeled_recoveries: 1, current_location: 'unknown' };
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(r => { resolve = r; }); return { promise, resolve }; }

test('disabled AI never loads a model or supplies personal facts', async () => {
  let loaded = false;
  const ai = new InferenceRunner(async () => { loaded = true; throw new Error('must not load'); });
  await assert.rejects(ai.explain(facts, () => false), /disabled/);
  assert.equal(loaded, false);
});
test('disable/delete during loading prevents prompt submission and releases context', async () => {
  const loading = deferred<InferenceContext>();
  let submitted = false, released = false;
  const ai = new InferenceRunner(() => loading.promise);
  const pending = ai.explain(facts, () => true);
  ai.cancel();
  loading.resolve({ complete: async () => { submitted = true; return 'unwanted'; }, stop: async () => {}, release: async () => { released = true; } });
  await assert.rejects(pending, /canceled/);
  assert.equal(submitted, false);
  assert.equal(released, true);
});
test('disable/delete in-flight discards late output and releases context', async () => {
  const completion = deferred<string>();
  const started = deferred<void>();
  let stopped = false, released = false, allowed = true;
  const ai = new InferenceRunner(async () => ({
    complete: async () => { started.resolve(); return completion.promise; },
    stop: async () => { stopped = true; }, release: async () => { released = true; },
  }));
  const pending = ai.explain(facts, () => allowed);
  await started.promise;
  allowed = false; ai.cancel(); completion.resolve('stale private output');
  await assert.rejects(pending, /canceled/);
  assert.equal(stopped, true); assert.equal(released, true); assert.equal(ai.isBusy(), false);
});
test('model failure clears busy state; a following request can succeed with exact facts', async () => {
  let attempt = 0;
  const ai = new InferenceRunner(async () => {
    if (!attempt++) throw new Error('Model unavailable');
    return { complete: async input => { assert.deepEqual(input, facts); return 'Check a previously recorded place.'; }, stop: async () => {}, release: async () => {} };
  });
  await assert.rejects(ai.explain(facts, () => true), /unavailable/);
  const output = await ai.explain(facts, () => true);
  assert.deepEqual(output.facts, facts);
  assert.ok(output.generationMs >= 0);
});
test('cancellation while native context is releasing still discards the result', async () => {
  const releasing = deferred<void>();
  const cleanup = deferred<void>();
  const ai = new InferenceRunner(async () => ({
    complete: async () => 'Old result', stop: async () => {},
    release: async () => { releasing.resolve(); await cleanup.promise; },
  }));
  const pending = ai.explain(facts, () => true);
  await releasing.promise;
  ai.cancel(); cleanup.resolve();
  await assert.rejects(pending, /canceled/);
  assert.equal(ai.isBusy(), false);
});
