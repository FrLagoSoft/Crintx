import { useEffect, useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Button } from '../components/Button';
import { Card, Screen } from '../components/Screen';
import { colors } from '../theme';
import { ask, isLoaded, loadModel, stop, unloadModel, type Answer } from './llm';
import { deleteModel, downloadModel, MODEL_BYTES, modelReady } from './model';

type Phase = 'checking' | 'missing' | 'downloading' | 'downloaded' | 'loading' | 'ready' | 'thinking';
const MB = (MODEL_BYTES / 1e6).toFixed(0);

/** Proof-of-concept: download a small model, load it on the phone, and prompt it. */
export default function AskScreen() {
  const [phase, setPhase] = useState<Phase>('checking');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [loadMs, setLoadMs] = useState<number | null>(null);
  const [prompt, setPrompt] = useState('');
  const [output, setOutput] = useState('');
  const [answer, setAnswer] = useState<Answer | null>(null);
  const streamed = useRef('');

  useEffect(() => {
    if (isLoaded()) { setPhase('ready'); return; }
    modelReady().then(ok => setPhase(ok ? 'downloaded' : 'missing')).catch(e => { setError(String(e?.message ?? e)); setPhase('missing'); });
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

  const send = () => run('thinking', 'ready', async () => {
    if (!prompt.trim()) throw new Error('Type a prompt first.');
    streamed.current = '';
    setOutput('');
    setAnswer(null);
    const result = await ask(prompt.trim(), token => { streamed.current += token; setOutput(streamed.current); });
    setAnswer(result);
    setOutput(result.text);
    setPhase('ready');
  });

  const remove = () => run('checking', 'missing', async () => {
    await unloadModel();
    await deleteModel();
    setOutput(''); setAnswer(null); setLoadMs(null);
    setPhase('missing');
  });

  return (
    <Screen title="Local AI" subtitle="Test: a small model running on this phone, no server.">
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
        {(phase === 'ready' || phase === 'thinking') && <>
          <Text className="text-live">Model loaded and running on this phone.</Text>
          {loadMs !== null && loadMs > 0 && <Text className="mt-xs text-dim">Load time: {(loadMs / 1000).toFixed(1)} s</Text>}
        </>}
        {phase !== 'missing' && phase !== 'checking' && phase !== 'downloading' &&
          <Button className="mt-md" variant="outline" icon="trash-outline" label="Delete model from phone" disabled={phase === 'loading' || phase === 'thinking'} onPress={remove} />}
      </Card>

      <Card label="2 · Prompt">
        <TextInput
          value={prompt}
          onChangeText={setPrompt}
          placeholder={phase === 'ready' || phase === 'thinking' ? 'Ask anything…' : 'Load the model first'}
          placeholderTextColor={colors.dim}
          editable={phase === 'ready'}
          multiline
          className="min-h-[80px] rounded-card border border-edge p-sm text-text"
          style={{ textAlignVertical: 'top' }}
        />
        <View className="mt-md flex-row gap-sm">
          <Button className="flex-1" icon="send" label="Ask" loading={phase === 'thinking'} disabled={phase !== 'ready' || !prompt.trim()} onPress={send} />
          {phase === 'thinking' && <Button variant="outline" label="Stop" onPress={() => void stop()} />}
        </View>
      </Card>

      {(!!output || phase === 'thinking') && <Card label="3 · Answer">
        <Text className="text-text" selectable>{output || '…'}</Text>
        {answer && <Text className="mt-sm text-xs text-dim">
          {(answer.ms / 1000).toFixed(1)} s · {answer.tokensPerSecond.toFixed(1)} tokens/s · generated on this phone
        </Text>}
      </Card>}
    </Screen>
  );
}
