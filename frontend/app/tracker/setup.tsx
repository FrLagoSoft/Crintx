import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Text } from 'react-native';
import { Card, Screen } from '../../src/components/Screen';
import { Action } from '../../src/components/TrackerControls';
import { hasModel, importModel, MODEL_INSTRUCTIONS } from '../../src/tracker/ai';
import { TRACKER_PROTOCOL } from '../../src/tracker/protocol';
import { useTracker } from '../../src/tracker/TrackerProvider';

export default function SetupScreen() {
  const tracker = useTracker();
  const router = useRouter();
  const [modelReady, setModelReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => { void hasModel().then(setModelReady).catch(() => setMessage('Could not inspect local model storage.')); }, []);
  async function selectModel() {
    setBusy(true); setMessage('');
    try { if (await importModel()) { setModelReady(true); setMessage('Model imported. Run an explanation to verify compatibility on this phone.'); } }
    catch (e) { setMessage(e instanceof Error ? e.message : 'Model import failed.'); }
    finally { setBusy(false); }
  }
  return <Screen title="Setup" subtitle="Local tracker prototype; device verification pending.">
    {!!message && <Text accessibilityRole="alert" className="text-signal">{message}</Text>}
    <Card label="Prototype scope">
      <Text className="text-dim">These tracker screens keep recovery history locally. The surrounding app still includes the existing server, GPS and model-download features. App-wide network and backup restrictions are not enabled in this combined prototype.</Text>
    </Card>
    <Card label="On-device model">
      <Text className="text-text">{modelReady ? 'GGUF file present; inference must still be tested.' : 'No local model imported.'}</Text>
      <Text className="mt-sm text-dim">Initial candidate: Qwen2.5-0.5B-Instruct Q4_K_M (Apache 2.0). Download its GGUF file during setup, then import from this phone's files. No model or history is downloaded or uploaded during a search.</Text>
      <Action title={busy ? 'Importing model…' : 'Import local GGUF model'} disabled={busy || tracker.analyzing !== null} onPress={() => void selectModel()} />
      <Text className="mt-sm text-dim">The app uses llama.rn on the phone, CPU mode, one request at a time. Loading and response timings appear with a successful explanation. Hardware speed and memory stability are not yet verified.</Text>
    </Card>
    <Card label="Instructions supplied to the model">
      <Text selectable className="text-dim">{MODEL_INSTRUCTIONS}</Text>
      <Text className="mt-sm text-dim">Open an item to inspect its exact model facts. Every request uses a fresh model context, released after completion or cancellation. No chat history is retained.</Text>
    </Card>
    <Card label="Tracker protocol">
      <Text className="text-text">{TRACKER_PROTOCOL.serviceUUID ? 'Service UUID configured.' : 'Awaiting firmware service UUID.'}</Text>
      <Text className="mt-sm text-dim">Target board: ESP32-WROOM-32E. The team reports a working buzzer; firmware source is now in the repository, but this adapter has not yet been connected to it or verified on the board. No ring payload will be guessed. The Inland Pro Micro is not used as the BLE tag.</Text>
    </Card>
    <Card label="Offline readiness">
      <Text className="text-dim">Use a native Android release APK with its JavaScript bundle embedded. Expo Go cannot run these native BLE and inference modules. After setup, test a cold launch with internet and Metro off, leaving Bluetooth enabled.</Text>
      <Text className="mt-sm text-dim">No server account, API health check, GPS request, cloud model or background scanning is needed for the core workflow.</Text>
    </Card>
    <Card label="Development simulation">
      <Text className="text-dim">Rehearse recoveries, persistence and privacy without hardware. Simulation history is isolated from real items and visibly labeled.</Text>
      <Action title="Open simulation lab" disabled={tracker.analyzing !== null} onPress={() => router.push('/simulation')} />
    </Card>
  </Screen>;
}
