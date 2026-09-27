import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { AppState, Switch, Text, TextInput, View } from 'react-native';
import { Button } from '../components/Button';
import { Card, Screen } from '../components/Screen';
import { colors } from '../theme';
import { ask, isLoaded, loadModel, stop, unloadModel, type Answer } from './llm';
import { deleteModel, downloadModel, MODEL_BYTES, modelReady } from './model';
import { getHistoryContext } from './history';
import type { HistoryContext } from './historyContext';

type Phase = 'checking' | 'missing' | 'downloading' | 'downloaded' | 'loading' | 'ready' | 'thinking';
const MB = (MODEL_BYTES / 1e6).toFixed(0);

/** Existing local model screen, now supplied with the app's recorded buzz history. */
export default function AskScreen() {
  const [phase, setPhase] = useState<Phase>('checking');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [loadMs, setLoadMs] = useState<number | null>(null);
  const [prompt, setPrompt] = useState('');
  const [output, setOutput] = useState('');
  const [answer, setAnswer] = useState<Answer | null>(null);
  const streamed = useRef('');
  const [includeHistory, setIncludeHistory] = useState(true);
  const [history, setHistory] = useState<HistoryContext | null>(null);
  const [showFacts, setShowFacts] = useState(false);
  const [activity, setActivity] = useState('');
  const request = useRef(0);
  const busy = useRef(false);
  const mounted = useRef(true);
  const cancel = useCallback(() => {
    request.current++;
    void stop().catch(() => {});
    if (mounted.current) { setOutput(''); setAnswer(null); setHistory(null); setActivity('Stopping…'); }
  }, []);

  useEffect(() => {
    mounted.current = true;
    const sub = AppState.addEventListener('change', state => { if (state !== 'active' && busy.current) cancel(); });
    return () => { mounted.current = false; request.current++; void stop().catch(() => {}); sub.remove(); };
  }, [cancel]);
  useFocusEffect(useCallback(() => () => { if (busy.current) cancel(); }, [cancel]));

  useEffect(() => {
    if (isLoaded()) { setPhase('ready'); return; }
    let active = true;
    modelReady().then(ok => { if (active) setPhase(ok ? 'downloaded' : 'missing'); }).catch(e => { if (active) { setError(String(e?.message ?? e)); setPhase('missing'); } });
    return () => { active = false; };
  }, []);

  async function run(next: Phase, fallback: Phase, work: () => Promise<void>) {
    setError('');
    setPhase(next);
    try { await work(); } catch (e: any) { setError(String(e?.message ?? e)); setPhase(fallback); }
  }

  const download = () => run('downloading', 'missing', async () => {
    setProgress(0);
    await downloadModel(setProgress);
    setPhase('downloaded');
  });

  const load = () => run('loading', 'downloaded', async () => {
    setLoadMs(await loadModel());
    setPhase('ready');
  });

  async function send(summary = false) {
    if (busy.current) return;
    if (!summary && !prompt.trim()) { setError('Type a question first.'); return; }
    busy.current = true;
    const id = ++request.current;
    const valid = () => mounted.current && request.current === id;
    setPhase('thinking'); setError(''); setHistory(null);
    streamed.current = '';
    setOutput('');
    setAnswer(null);
    try {
      let facts: HistoryContext | undefined;
      if (summary || includeHistory) {
        setActivity('Reading your recent buzz history…');
        facts = await getHistoryContext();
        if (!valid()) return;
        setHistory(facts);
        if (facts.status === 'unavailable') throw new Error('Could not read your buzz history. Check the server connection and try again, or turn off history to ask a general question.');
        if (summary && facts.status === 'empty') {
          setOutput('No buzz locations are recorded yet. Buzz a tag using the usual app controls, then try again.');
          return;
        }
      }
      if (!isLoaded()) {
        setActivity('Loading the model on this phone…');
        const ms = await loadModel();
        if (!valid()) return;
        setLoadMs(ms);
      }
      setActivity('Writing your answer on this phone…');
      const question = summary ? 'Give a friendly, short summary of where my things were buzzed in these recent records. Mention the most frequent recorded areas and make clear that this does not locate them now.' : prompt.trim();
      const result = await ask(question, token => {
        if (valid()) { streamed.current += token; setOutput(streamed.current); }
      }, facts);
      if (!valid()) return;
      setAnswer(result); setOutput(result.text);
    } catch (e: any) {
      if (valid()) { setOutput(''); setError(String(e?.message ?? e)); }
    } finally {
      busy.current = false;
      if (mounted.current) { setActivity(''); setPhase(isLoaded() ? 'ready' : 'downloaded'); }
    }
  }

  const remove = () => run('checking', 'missing', async () => {
    await unloadModel();
    await deleteModel();
    setOutput(''); setAnswer(null); setLoadMs(null);
    setPhase('missing');
  });

  return (
    <Screen title="Local AI" subtitle="Ask about your buzz history. Answers are generated on this phone.">
      {!!error && <Text className="text-fault" selectable>{error}</Text>}

      <Card label="1 · Model">
        {phase === 'checking' && <Text className="text-dim">Checking for the model…</Text>}
        {phase === 'missing' && <>
          <Text className="text-text">Qwen2.5 0.5B Instruct (4-bit) · {MB} MB</Text>
          <Text className="mt-xs text-dim">One-time download over the internet. Use Wi-Fi.</Text>
          <Button className="mt-md" icon="cloud-download-outline" label={`Download model (${MB} MB)`} onPress={download} />
        </>}
        {phase === 'downloading' && <>
          <Text className="text-text">Downloading… {(progress * 100).toFixed(0)}%</Text>
          <View className="mt-sm h-2 overflow-hidden rounded-pill bg-edge">
            <View style={{ width: `${Math.min(100, progress * 100)}%`, height: '100%', backgroundColor: colors.signal }} />
          </View>
          <Text className="mt-xs text-dim">Keep the app open until it finishes.</Text>
        </>}
        {(phase === 'downloaded' || phase === 'loading') && <>
          <Text className="text-live">Model downloaded to this phone.</Text>
          <Button className="mt-md" icon="hardware-chip-outline" label="Load model" loading={phase === 'loading'} onPress={load} />
          {phase === 'loading' && <Text className="mt-xs text-dim">Loading into memory, can take several seconds…</Text>}
        </>}
        {(phase === 'ready' || (phase === 'thinking' && isLoaded())) && <>
          <Text className="text-live">Model loaded and running on this phone.</Text>
          {loadMs !== null && loadMs > 0 && <Text className="mt-xs text-dim">Load time: {(loadMs / 1000).toFixed(1)} s</Text>}
        </>}
        {phase !== 'missing' && phase !== 'checking' && phase !== 'downloading' &&
          <Button className="mt-md" variant="outline" icon="trash-outline" label="Delete model from phone" disabled={phase === 'loading' || phase === 'thinking'} onPress={remove} />}
      </Card>

      <Card label="Your buzz history">
        <Text className="text-dim">Uses up to 50 recent records from Buzzer History and tag names saved on this phone. Nearby records are grouped into approximate areas. These are phone locations when buzzing, not confirmed finds.</Text>
        <Button className="mt-md" icon="sparkles-outline" label="Summarize my history" disabled={!['ready', 'downloaded'].includes(phase)} onPress={() => void send(true)} />
        <View className="mt-md flex-row items-center justify-between">
          <Text className="flex-1 text-text">Include history in my questions</Text>
          <Switch accessibilityLabel="Include buzz history in AI questions" value={includeHistory} disabled={phase === 'thinking'} onValueChange={value => { setIncludeHistory(value); setHistory(null); setOutput(''); setAnswer(null); }} />
        </View>
        <Text className="mt-xs text-xs text-dim">History needs the existing server. Area names use the app's existing address lookup; if unavailable, coordinates are shown. No AI cloud service receives the prompt.</Text>
        {history && <>
          <Text className="mt-sm text-dim">{history.status === 'ready' ? `${history.records} recent records; ${history.omittedRecords} outside the five most frequent groups.` : history.status === 'empty' ? 'No recorded buzz history yet.' : 'History unavailable.'}</Text>
          <Button variant="outline" label={showFacts ? 'Hide history used' : 'Show history used'} onPress={() => setShowFacts(!showFacts)} />
          {showFacts && <Text selectable className="mt-sm text-dim">{JSON.stringify(history, null, 2)}</Text>}
        </>}
      </Card>

      <Card label="Your question">
        <TextInput
          value={prompt}
          onChangeText={setPrompt}
          placeholder={phase === 'ready' || phase === 'downloaded' || phase === 'thinking' ? 'Where have I buzzed my keys most often?' : 'Download the model first'}
          placeholderTextColor={colors.dim}
          editable={phase === 'ready' || phase === 'downloaded'}
          maxLength={800}
          multiline
          className="min-h-[80px] rounded-card border border-edge p-sm text-text"
          style={{ textAlignVertical: 'top' }}
        />
        <View className="mt-md flex-row gap-sm">
          <Button className="flex-1" icon="send" label="Ask" loading={phase === 'thinking'} disabled={!['ready', 'downloaded'].includes(phase) || !prompt.trim()} onPress={() => void send()} />
          {phase === 'thinking' && <Button variant="outline" label="Stop" onPress={cancel} />}
        </View>
      </Card>

      {(!!output || phase === 'thinking') && <Card label="3 · Answer">
        <Text className="text-text" selectable>{output || activity || '…'}</Text>
        {answer && <Text className="mt-sm text-xs text-dim">
          {(answer.ms / 1000).toFixed(1)} s · {answer.tokensPerSecond.toFixed(1)} tokens/s · generated on this phone
        </Text>}
      </Card>}
    </Screen>
  );
}
