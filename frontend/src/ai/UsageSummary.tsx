import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { AppState, Pressable, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { ask, isLoaded, loadModel, stop } from './llm';
import { modelReady } from './model';
import { getHistoryContext } from './history';
import type { HistoryContext } from './historyContext';

const USAGE_SUMMARY_PROMPT = 'Use the supplied real buzz history to write two short, friendly sentences about my usage. Mention an item, its most frequent recorded area and its buzz count. You have the records in this message: answer from them directly. Describe past buzzes, not confirmed finds or current positions. Do not invent facts.';

/** Small Settings action using the same model as the existing AI screen. */
export function UsageSummary() {
  const [expanded, setExpanded] = useState(false);
  const [facts, setFacts] = useState<HistoryContext | null>(null);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);
  const [status, setStatus] = useState('');
  const running = useRef(false);
  const version = useRef(0);
  const mounted = useRef(true);
  const ownsCompletion = useRef(false);
  const cancel = useCallback(() => {
    version.current++;
    if (ownsCompletion.current) void stop().catch(() => {});
    if (mounted.current) { setOutput(''); setStatus('Stopping…'); }
  }, []);
  useEffect(() => {
    mounted.current = true;
    const sub = AppState.addEventListener('change', state => { if (state !== 'active' && running.current) cancel(); });
    return () => { mounted.current = false; cancel(); sub.remove(); };
  }, [cancel]);
  useFocusEffect(useCallback(() => () => { if (running.current) cancel(); }, [cancel]));

  async function summarize() {
    if (running.current) return;
    running.current = true;
    const request = ++version.current;
    const valid = () => mounted.current && request === version.current;
    setFacts(null); setWorking(true); setError(''); setOutput(''); setStatus('Reading saved buzzes…');
    try {
      const snapshot = await getHistoryContext();
      if (!valid()) return;
      setFacts(snapshot);
      if (snapshot.status === 'unavailable') throw new Error('Could not read the history saved on this phone.');
      if (snapshot.status === 'empty') { setOutput('No buzzes saved on this phone yet. Buzz a tag, then try again.'); return; }
      if (!isLoaded() && !await modelReady()) {
        if (valid()) setError('Open AI Model below and download the model once, then try again.');
        return;
      }
      if (!valid()) return;
      await loadModel();
      if (!valid()) return;
      setStatus('Writing your summary…');
      ownsCompletion.current = true;
      const result = await ask(USAGE_SUMMARY_PROMPT, undefined, snapshot);
      if (valid()) setOutput(result.text);
    } catch (e: any) {
      if (valid()) setError(String(e?.message ?? e));
    } finally {
      ownsCompletion.current = false; running.current = false;
      if (mounted.current) { setWorking(false); setStatus(''); }
    }
  }

  return <View className="gap-sm">
    <View className="flex-row items-center gap-sm">
      <Button className="flex-1" label="Give me a summary of my usage" loading={working} onPress={() => void summarize()} />
      <Pressable onPress={() => setExpanded(!expanded)} accessibilityRole="button"
        accessibilityLabel="Show summary data" accessibilityState={{ expanded }}
        className="min-h-12 min-w-12 items-center justify-center rounded-pill border-2 border-ink p-sm">
        <Text className="text-ink">{expanded ? '▴' : '▾'}</Text>
      </Pressable>
    </View>
    <Text className="font-mono text-xs text-dim">Saved on this phone · temporary storage until backend is fixed</Text>
    {expanded && <View className="rounded-tile bg-panel p-md">
      {!facts && <Text className="text-dim">Generate a summary to see the history used.</Text>}
      {facts?.groups.map((entry, index) => <Text key={index} className="mb-sm text-text">
        {entry.tag} · {entry.place} · {entry.count} buzzes · {entry.latest}
      </Text>)}
      {facts && <Text className="text-dim">{facts.records} records; {facts.omittedRecords} outside the displayed groups.</Text>}
    </View>}
    {!!error && <Text accessibilityRole="alert" className="text-fault">{error}</Text>}
    {!!output && <Text selectable className="rounded-tile bg-panel p-md text-text">{output}</Text>}
    {working && <>
      <Text className="text-dim">{status}</Text>
      <Button variant="outline" label="Stop summary" onPress={cancel} />
    </>}
  </View>;
}
