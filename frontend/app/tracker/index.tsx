import { useState, useCallback } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Card, Screen } from '../../src/components/Screen';
import { Action, Field } from '../../src/components/TrackerControls';
import { useTracker } from '../../src/tracker/TrackerProvider';
import { isDetected, modelFacts, suggestion, summarize } from '../../src/tracker/domain';
import { TRACKER_PROTOCOL } from '../../src/tracker/protocol';

export default function TagsScreen() {
  const tracker = useTracker();
  const [selected, setSelected] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [place, setPlace] = useState('');
  const [recoverySession, setRecoverySession] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showFacts, setShowFacts] = useState(false);
  const item = tracker.data.items.find(i => i.id === selected);
  const stop = tracker.stop;
  useFocusEffect(useCallback(() => () => stop(), []));
  async function run(action: () => Promise<unknown>) {
    setMessage('');
    try { await action(); } catch (e) { setMessage(e instanceof Error ? e.message : 'Action failed. Try again.'); }
  }
  const observation = item ? tracker.observations[item.deviceId] : undefined;
  const detected = isDetected(observation?.observedAt, tracker.now);
  const last = item ? tracker.data.sightings.filter(s => s.itemId === item.id).sort((a, b) => b.observedAt - a.observedAt)[0] : undefined;
  const summary = item ? summarize(tracker.data, item.id) : null;
  const explanation = item ? tracker.explanations[item.id] : undefined;
  return <Screen title={item ? item.displayName : 'Your items'} subtitle="Find nearby. Remember where you recovered it.">
    {!!tracker.error && <Text className="text-fault">{tracker.error}</Text>}
    {!!message && <Text accessibilityRole="alert" className="text-signal">{message}</Text>}
    {!tracker.ready ? <Text className="text-dim">Loading local history…</Text> : <>
      <Card label="Bluetooth search">
        <Text className="text-dim">Nearby devices permission lets this app detect supported tags. Older Android versions require Location permission for BLE scanning; this app does not request GPS coordinates.</Text>
        <Text className="mt-sm text-text">{tracker.status}</Text>
        <Action title="Search for 30 seconds" onPress={() => void run(tracker.scan)} />
        <Action title="Stop search" onPress={tracker.stop} />
      </Card>
      {item ? <>
        <Action title="Back to all items" onPress={() => { setSelected(null); setRecoverySession(null); setShowFacts(false); setMessage(''); }} />
        <Card label="Current detection">
          <Text className="text-lg font-semibold text-text">{detected ? 'Detected just now' : 'Not currently detected'}</Text>
          <Text className="mt-sm text-dim">{last ? `Last detected ${new Date(last.observedAt).toLocaleString()}` : 'No saved detections.'}</Text>
          {detected && observation?.rssi != null && <Text className="mt-sm text-dim">Smoothed signal: {observation.rssi} dBm. Signal fluctuates; this is not a distance or direction.</Text>}
          <Text className="mt-sm text-dim">Current location unknown. Detection does not identify a room.</Text>
          <Action title={tracker.ringing ? 'Sending ring command…' : 'Ring tracker'} disabled={!detected || tracker.ringing || !TRACKER_PROTOCOL.firmwareBoundsRingDuration}
            onPress={() => void run(() => tracker.ring(item.deviceId))} />
          {!TRACKER_PROTOCOL.firmwareBoundsRingDuration && <Text className="mt-sm text-dim">Ring awaits the actual firmware protocol and a bounded buzzer command.</Text>}
          {!!TRACKER_PROTOCOL.stopCommandBase64 && <Action title="Stop ringing" onPress={() => void run(tracker.stopRing)} />}
        </Card>
        <Card label="Remembered recovery">
          <Text className="text-text">{summary?.lastConfirmedRecovery ? `${summary.lastConfirmedRecovery.placeLabel ?? 'Place skipped'} · ${new Date(summary.lastConfirmedRecovery.confirmedAt).toLocaleString()}` : 'No confirmed recoveries yet.'}</Text>
          <Text className="mt-sm text-dim">Places are entered by you after recovery, never automatically detected.</Text>
          {!recoverySession ? <Action title="Found it" onPress={() => { setRecoverySession(tracker.beginRecovery(item.id)); setPlace(''); }} /> : <View>
            <Field placeholder="Where did you find it? (optional)" value={place} onChangeText={setPlace} />
            {summary?.places.map(p => <Action key={p.label} title={p.label} onPress={() => setPlace(p.label)} />)}
            <Action title={saving ? 'Saving…' : place.trim() ? 'Save confirmed recovery' : 'Save recovery without a place'} disabled={saving} onPress={() => {
              if (saving) return;
              setSaving(true);
              void run(async () => { await tracker.recover(item.id, place, recoverySession); setRecoverySession(null); setMessage('Recovery saved on this phone. Start a new search before recording another recovery.'); }).finally(() => setSaving(false));
            }} />
            <Action title="Cancel" disabled={saving} onPress={() => setRecoverySession(null)} />
          </View>}
        </Card>
        <Card label="Search suggestion">
          <Text className="text-text">{suggestion(tracker.data, item.id)}</Text>
          <Text className="mt-sm text-dim">History summary calculated by the app. No model needed.</Text>
          <Action title={tracker.analyzing === item.id ? 'Generating on this phone…' : 'Explain with on-device AI'} disabled={!item.aiEnabled || tracker.analyzing !== null}
            onPress={() => void run(() => tracker.explain(item.id))} />
          {!item.aiEnabled && <Text className="mt-sm text-dim">AI is off for this item. Enable it in History & privacy.</Text>}
          {!!tracker.analyzing && <Action title="Cancel analysis" onPress={tracker.cancelAnalysis} />}
          {explanation && <View><Text className="mt-md text-text">{explanation.text}</Text>
            <Text className="mt-sm text-dim">Generated on this phone; may be inaccurate. Use the recorded facts above. Load {explanation.loadMs} ms · response {explanation.generationMs} ms. Detection facts reflect request time.</Text></View>}
          {item.aiEnabled && <Action title={showFacts ? 'Hide model input' : 'Show exact model facts'} onPress={() => setShowFacts(!showFacts)} />}
          {showFacts && item.aiEnabled && <Text selectable className="mt-sm text-dim">{JSON.stringify(tracker.submittedFacts[item.id] ?? modelFacts(tracker.data, item.id, observation?.observedAt, tracker.now), null, 2)}</Text>}
        </Card>
      </> : <>
        {tracker.data.items.map(i => <Card key={i.id} label={i.displayName}>
          <Text className="text-dim">{isDetected(tracker.observations[i.deviceId]?.observedAt, tracker.now) ? 'Detected just now' : 'Not currently detected'}</Text>
          <Action title="Find / confirm recovery" onPress={() => { setSelected(i.id); setMessage(''); }} />
        </Card>)}
        {!tracker.data.items.length && <Card><Text className="text-text">No items yet. Power on your supported tracker, search, then give it an item name.</Text></Card>}
        <Card label="Associate a discovered tracker">
          <Field value={name} onChangeText={setName} placeholder="Item name, such as Keys" />
          <Text className="mt-sm text-dim">Your item name stays in the app; it is not broadcast as a Bluetooth name. Address changes may require reassociation until firmware provides a stable tag identity.</Text>
          {tracker.tags.filter(t => !tracker.data.items.some(i => i.deviceId === t.id)).map(tag => <Action key={tag.id} title={`Associate ${tag.name} (${tag.id})`} disabled={!name.trim() || !isDetected(tag.observedAt, tracker.now)} onPress={() => void run(async () => { setSelected(await tracker.associate(tag, name)); setName(''); })} />)}
          {!tracker.tags.length && <Text className="mt-sm text-dim">No supported trackers detected in this search.</Text>}
        </Card>
      </>}
    </>}
  </Screen>;
}
