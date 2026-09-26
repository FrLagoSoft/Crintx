import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';
import { AppState } from 'react-native';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { LocalInference, type Explanation, type ModelFacts } from './ai';
import { ForegroundTracker, type DiscoveredTag } from './ble';
import { addItem, confirmRecovery, deleteHistory, emptyData, modelFacts, recordSighting, setAiEnabled, type TrackerData } from './domain';
import { TrackerRepository } from './repository';

function useTrackerController() {
  const [data, setData] = useState<TrackerData>(emptyData);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('Start a foreground search to detect your tracker.');
  const [tags, setTags] = useState<DiscoveredTag[]>([]);
  const [observations, setObservations] = useState<Record<string, DiscoveredTag>>({});
  const [explanations, setExplanations] = useState<Record<string, Explanation>>({});
  const [submittedFacts, setSubmittedFacts] = useState<Record<string, ModelFacts>>({});
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [ringing, setRinging] = useState(false);
  const [now, setNow] = useState(Date.now());
  const repo = useRef<TrackerRepository | null>(null);
  if (!repo.current) repo.current = new TrackerRepository(AsyncStorage, setData);
  const ble = useRef<ForegroundTracker | null>(null);
  if (!ble.current) ble.current = new ForegroundTracker();
  const ai = useRef<LocalInference | null>(null);
  if (!ai.current) ai.current = new LocalInference();
  const revisions = useRef<Record<string, number>>({});
  const denied = useRef(new Set<string>());
  const sessions = useRef<Record<string, string>>({});
  const lastSaved = useRef<Record<string, number>>({});

  useEffect(() => {
    void repo.current!.load().then(() => setReady(true)).catch(e => setError(String(e.message)));
    const tick = setInterval(() => setNow(Date.now()), 1000);
    const lifecycle = AppState.addEventListener('change', state => {
      if (state !== 'active') {
        ble.current!.stop();
        void ble.current!.disconnect();
        ai.current!.cancel();
        setObservations({});
        setExplanations({});
        setSubmittedFacts({});
        setStatus('Search stopped while app was inactive. Start a new foreground search.');
      }
    });
    return () => { clearInterval(tick); lifecycle.remove(); ble.current!.dispose(); ai.current!.cancel(); };
  }, []);

  function invalidate(itemId: string) {
    revisions.current[itemId] = (revisions.current[itemId] ?? 0) + 1;
    ai.current!.cancel();
    setExplanations(previous => { const next = { ...previous }; delete next[itemId]; return next; });
    setSubmittedFacts(previous => { const next = { ...previous }; delete next[itemId]; return next; });
  }
  async function scan() {
    setError('');
    setTags([]);
    setObservations({});
    for (const item of repo.current!.snapshot().items) sessions.current[item.id] = randomUUID();
    await ble.current!.scan(tag => {
      setTags(previous => [...previous.filter(t => t.id !== tag.id), tag]);
      setObservations(previous => ({ ...previous, [tag.id]: tag }));
      const item = repo.current!.snapshot().items.find(i => i.deviceId === tag.id);
      if (item && tag.observedAt - (lastSaved.current[item.id] ?? 0) >= 5000) {
        lastSaved.current[item.id] = tag.observedAt;
        void repo.current!.update(d => recordSighting(d, { itemId: item.id, source: 'ble', observedAt: tag.observedAt, rssi: tag.rssi }))
          .catch(e => setError(`Could not save detection: ${e.message}`));
      }
    }, setStatus);
  }
  function stop() { ble.current!.stop(); setStatus('Search stopped. Recent detection expires after 15 seconds.'); }
  async function associate(tag: DiscoveredTag, name: string) {
    const id = randomUUID();
    await repo.current!.update(d => addItem(d, { id, deviceId: tag.id, displayName: name, aiEnabled: false, createdAt: Date.now() }));
    sessions.current[id] = randomUUID();
    await repo.current!.update(d => recordSighting(d, { itemId: id, source: 'ble', observedAt: tag.observedAt, rssi: tag.rssi }));
    return id;
  }
  function beginRecovery(itemId: string) { return sessions.current[itemId] ??= randomUUID(); }
  async function recover(itemId: string, placeLabel: string, searchSessionId: string) {
    invalidate(itemId);
    await repo.current!.update(d => confirmRecovery(d, { id: randomUUID(), itemId, confirmedAt: Date.now(), placeLabel, searchSessionId, provenance: 'user_confirmed' }));
    invalidate(itemId);
    stop();
  }
  async function privacy(itemId: string, enabled: boolean) {
    invalidate(itemId);
    if (!enabled) denied.current.add(itemId);
    await repo.current!.update(d => setAiEnabled(d, itemId, enabled));
    invalidate(itemId);
    if (enabled) denied.current.delete(itemId);
  }
  async function clearHistory(itemId: string) {
    invalidate(itemId);
    ble.current!.stop();
    const item = repo.current!.snapshot().items.find(i => i.id === itemId);
    if (item) setObservations(previous => { const next = { ...previous }; delete next[item.deviceId]; return next; });
    await repo.current!.update(d => deleteHistory(d, itemId));
    invalidate(itemId);
    delete lastSaved.current[itemId];
    delete sessions.current[itemId];
    setStatus('History deleted. Start a new search to record fresh detections.');
  }
  async function explain(itemId: string) {
    if (ai.current!.isBusy()) throw new Error('A model request is still finishing. Try again shortly.');
    const snapshot = repo.current!.snapshot();
    const item = snapshot.items.find(i => i.id === itemId)!;
    const revision = revisions.current[itemId] ?? 0;
    const permitted = () => !denied.current.has(itemId) && !!repo.current!.snapshot().items.find(i => i.id === itemId)?.aiEnabled
      && revision === (revisions.current[itemId] ?? 0);
    const facts = modelFacts(snapshot, itemId, observations[item.deviceId]?.observedAt, Date.now());
    setSubmittedFacts(previous => ({ ...previous, [itemId]: facts }));
    setAnalyzing(itemId);
    try {
      const explanation = await ai.current!.explain(facts, permitted);
      if (permitted()) setExplanations(previous => ({ ...previous, [itemId]: explanation }));
    } finally { setAnalyzing(null); }
  }
  async function ring(deviceId: string) {
    setRinging(true);
    try { setStatus(await ble.current!.ring(deviceId)); } finally { setRinging(false); }
  }
  return { data, ready, error, setError, status, tags, observations, explanations, submittedFacts, analyzing, ringing, now,
    scan, stop, associate, beginRecovery, recover, privacy, clearHistory, explain, ring,
    stopRing: () => ble.current!.stopRing(), cancelAnalysis: () => ai.current!.cancel() };
}

type Tracker = ReturnType<typeof useTrackerController>;
const Context = createContext<Tracker | null>(null);
export function TrackerProvider({ children }: { children: ReactNode }) {
  const tracker = useTrackerController();
  return <Context.Provider value={tracker}>{children}</Context.Provider>;
}
export function useTracker() {
  const tracker = useContext(Context);
  if (!tracker) throw new Error('TrackerProvider missing.');
  return tracker;
}
