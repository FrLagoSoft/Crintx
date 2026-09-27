import { useState } from 'react';
import { Alert, Switch, Text, View } from 'react-native';
import { Card, Screen } from '../../src/components/Screen';
import { Action } from '../../src/components/HistoryControls';
import { useRecoveryHistory } from '../../src/history/HistoryProvider';
import { summarize } from '../../src/history/domain';

export default function HistoryScreen() {
  const tracker = useRecoveryHistory();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  async function run(id: string, work: () => Promise<void>) {
    setBusy(id); setMessage('');
    try { await work(); } catch (e) { setMessage(e instanceof Error ? e.message : 'Could not save this change.'); }
    finally { setBusy(null); }
  }
  return <Screen title="History & privacy" subtitle="User-confirmed recoveries, stored on this phone.">
    {!!message && <Text accessibilityRole="alert" className="text-fault">{message}</Text>}
    <Card label="You control the history">
      <Text className="text-dim">AI is off by default. When enabled, the item name, detection flag, last detection time, five most frequent recovery places and recovery counts are supplied to the local model. Other labeled recoveries are included only as a total. No cloud AI request or history synchronization is used.</Text>
      <Text className="mt-sm text-dim">The local app store is not separately encrypted by this prototype. Android backup is disabled for the app. Deletion removes app-visible records and generated explanations; it is not forensic secure erasure.</Text>
      <Text className="mt-sm text-dim">This prototype keeps at most 1,000 recoveries and 200 sampled detections across all items. Older records are removed at those limits. Generated explanations are held only in memory.</Text>
    </Card>
    {!tracker.data.items.length && <Card><Text className="text-text">No items yet. Associate a tracker in Your items to start recording recoveries.</Text></Card>}
    {tracker.data.items.map(item => {
      const summary = summarize(tracker.data, item.id);
      return <Card key={item.id} label={item.displayName}>
        <View className="flex-row items-center justify-between">
          <Text className="text-text">Allow on-device AI for this item</Text>
          <Switch accessibilityLabel={`Allow AI for ${item.displayName}`} value={item.aiEnabled} disabled={busy !== null}
            onValueChange={enabled => void run(item.id, () => tracker.privacy(item.id, enabled))} />
        </View>
        <Text className="mt-sm text-dim">Tracking, recovery history and ordinary summaries work with AI off.</Text>
        <Text className="mt-md text-text">{summary.recoveries.length} confirmed recoveries · {summary.labeledCount} with a place</Text>
        {summary.places.map(p => <Text key={p.label} className="mt-sm text-dim">{p.label}: {p.count} recorded {p.count === 1 ? 'recovery' : 'recoveries'}</Text>)}
        {!summary.recoveries.length && <Text className="mt-sm text-dim">No recovery history. Detection alone never adds a recovery.</Text>}
        {summary.recoveries.map(r => <View key={r.id} className="mt-md">
          <Text className="text-text">{r.placeLabel ?? 'Place skipped'}</Text>
          <Text className="text-dim">{new Date(r.confirmedAt).toLocaleString()} · confirmed by you</Text>
        </View>)}
        <Action title="Delete this item's history" disabled={busy !== null} onPress={() => Alert.alert('Delete history?', 'Remove this item’s recoveries, remembered places, saved detections and generated explanation. Keep its name and tracker association.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete history', style: 'destructive', onPress: () => void run(item.id, () => tracker.clearHistory(item.id)) },
        ])} />
      </Card>;
    })}
  </Screen>;
}
