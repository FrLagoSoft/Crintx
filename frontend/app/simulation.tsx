import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AppState, Switch, Text } from 'react-native';
import { Card, Screen } from '../src/components/Screen';
import { Action, Field } from '../src/components/TrackerControls';
import { LocalInference, type Explanation } from '../src/tracker/ai';
import { addItem, confirmRecovery, deleteHistory, emptyData, isDetected, modelFacts, recordSighting, setAiEnabled, suggestion, summarize } from '../src/tracker/domain';
import { TrackerRepository } from '../src/tracker/repository';

// A separate key and explicit simulated source: no seeded records enter the real tracker store.
const SIMULATION_KEY = 'crintx.simulation.v1';
const ITEM_ID = 'simulation-keys';
export default function SimulationScreen() {
  const router = useRouter();
  const [data, setData] = useState(emptyData);
  const [ready, setReady] = useState(false);
  const [place, setPlace] = useState('');
  const [message, setMessage] = useState('');
  const [now, setNow] = useState(Date.now());
  const [observedAt, setObservedAt] = useState<number>();
  const [busy, setBusy] = useState(false);
  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const session = useRef(randomUUID());
  const revision = useRef(0);
  const ai = useRef(new LocalInference());
  const repo = useRef<TrackerRepository | null>(null);
  if (!repo.current) repo.current = new TrackerRepository({
    getItem: () => AsyncStorage.getItem(SIMULATION_KEY),
    setItem: (_key, value) => AsyncStorage.setItem(SIMULATION_KEY, value),
  }, setData);
  useEffect(() => {
    void repo.current!.load().then(async state => {
      if (!state.items.length) await repo.current!.update(d => addItem(d, { id: ITEM_ID, displayName: 'Simulated keys', deviceId: 'SIMULATED', aiEnabled: false, createdAt: Date.now() }));
      setReady(true);
    }).catch(e => setMessage(e.message));
    const interval = setInterval(() => setNow(Date.now()), 1000);
    const lifecycle = AppState.addEventListener('change', state => {
      if (state !== 'active') { revision.current++; ai.current.cancel(); setExplanation(null); setObservedAt(undefined); }
    });
    return () => { clearInterval(interval); lifecycle.remove(); revision.current++; ai.current.cancel(); };
  }, []);
  function invalidate() { revision.current++; ai.current.cancel(); setExplanation(null); }
  async function run(work: () => Promise<unknown>) {
    setMessage('');
    try { await work(); } catch (e) { setMessage(e instanceof Error ? e.message : 'Simulation action failed.'); }
  }
  const summary = summarize(data, ITEM_ID);
  const enabled = data.items[0]?.aiEnabled ?? false;
  return <Screen title="Simulation lab" subtitle="SIMULATED DATA · no physical hardware evidence">
    <Action title="Exit simulation" onPress={() => router.back()} />
    <Card label="Separate test history">
      <Text className="text-signal">This screen uses an isolated local store. Signals and ring responses are simulated. Nothing here verifies ESP32 discovery, sound or physical movement.</Text>
      <Text className="mt-sm text-dim">Use this lab to rehearse recovery, restart persistence, privacy and model failure without a tag. AI, if available, runs on the phone using these visibly simulated records.</Text>
    </Card>
    {!!message && <Text accessibilityRole="alert" className="text-signal">{message}</Text>}
    {ready && <>
      <Card label="Simulated keys">
        <Text className="text-text">{isDetected(observedAt, now) ? 'Simulated detection just now' : 'Not currently detected (simulation)'}</Text>
        <Action title="Simulate one detection / start search" onPress={() => void run(async () => {
          const timestamp = Date.now(); session.current = randomUUID(); setObservedAt(timestamp);
          await repo.current!.update(d => recordSighting(d, { itemId: ITEM_ID, observedAt: timestamp, rssi: -58, source: 'simulated' }));
        })} />
        <Action title="Simulate disappearance" onPress={() => setObservedAt(undefined)} />
        <Action title="Simulate ring response (no sound)" onPress={() => setMessage('SIMULATED command response only. No Bluetooth command sent and no buzzer verified.')} />
      </Card>
      <Card label="Confirm a simulated recovery">
        <Field placeholder="Recovery place (optional)" value={place} onChangeText={setPlace} />
        <Action title="Found it — save simulated recovery" onPress={() => void run(async () => {
          invalidate();
          await repo.current!.update(d => confirmRecovery(d, { id: randomUUID(), itemId: ITEM_ID, confirmedAt: Date.now(), placeLabel: place, provenance: 'user_confirmed', searchSessionId: session.current }));
          invalidate(); setMessage('Simulated recovery saved. Repeated saves in this search do not add another recovery.');
        })} />
        <Text className="mt-md text-text">{suggestion(data, ITEM_ID)}</Text>
        {summary.recoveries.map(r => <Text key={r.id} className="mt-sm text-dim">SIMULATED · {r.placeLabel ?? 'Place skipped'} · {new Date(r.confirmedAt).toLocaleString()}</Text>)}
      </Card>
      <Card label="Simulation privacy and inference">
        <Text className="text-text">Allow AI on simulated history</Text>
        <Switch accessibilityLabel="Allow AI on simulated history" value={enabled} onValueChange={value => void run(async () => {
          invalidate(); await repo.current!.update(d => setAiEnabled(d, ITEM_ID, value)); invalidate();
        })} />
        <Action title={busy ? 'Generating locally…' : 'Run on-device inference on simulated facts'} disabled={!enabled || busy} onPress={() => void run(async () => {
          if (ai.current.isBusy()) throw new Error('Model is still finishing.');
          setBusy(true);
          const token = revision.current;
          const permitted = () => revision.current === token && !!repo.current!.snapshot().items[0]?.aiEnabled;
          try {
            const output = await ai.current.explain(modelFacts(repo.current!.snapshot(), ITEM_ID, observedAt, Date.now()), permitted);
            if (permitted()) setExplanation(output);
          } finally { setBusy(false); }
        })} />
        {busy && <Action title="Cancel inference" onPress={invalidate} />}
        {explanation && <><Text className="mt-sm text-text">{explanation.text}</Text><Text className="mt-sm text-dim">Real on-device model output on simulated facts. Load {explanation.loadMs} ms; response {explanation.generationMs} ms. Verify wording against the facts.</Text></>}
        {enabled && <Text selectable className="mt-sm text-dim">{JSON.stringify(explanation?.facts ?? modelFacts(data, ITEM_ID, observedAt, now), null, 2)}</Text>}
        <Action title="Delete all simulation history" onPress={() => void run(async () => {
          invalidate(); setObservedAt(undefined);
          await repo.current!.update(d => deleteHistory(d, ITEM_ID)); invalidate(); session.current = randomUUID();
          setMessage('Simulation history and derived explanation deleted. Real item history was untouched.');
        })} />
      </Card>
    </>}
  </Screen>;
}
