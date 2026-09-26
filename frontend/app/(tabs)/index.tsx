import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { scanForTags, stopScan, type Tag } from '../../src/ble';
import { Button } from '../../src/components/Button';
import { Card, Screen } from '../../src/components/Screen';
import { TagCard, type RunAction } from '../../src/components/TagCard';
import { colors } from '../../src/theme';

export default function TagsScreen() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => stopScan, []);

  async function scan() {
    setScanning(true);
    setMessage(null);
    setTags([]);
    try {
      await scanForTags((tag) =>
        setTags((prev) =>
          [...prev.filter((t) => t.id !== tag.id), tag].sort((a, b) => (b.rssi ?? -999) - (a.rssi ?? -999))
        )
      );
    } catch (e: any) {
      setMessage({ ok: false, text: e?.message ?? 'Scan failed.' });
    } finally {
      setScanning(false);
      setScanned(true);
    }
  }

  // One Bluetooth action at a time: tags hold a single connection.
  const run: RunAction = async (id, action, success) => {
    setBusyId(id);
    setMessage(null);
    try {
      await action();
      if (success) setMessage({ ok: true, text: success });
      return true;
    } catch (e: any) {
      setMessage({ ok: false, text: e?.message ?? 'Something went wrong.' });
      return false;
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Screen title="Tags" subtitle="ESP32 buzzers in Bluetooth range, nearest first.">
      <Button
        label={scanning ? 'Scanning…' : 'Scan for tags'}
        icon="scan-outline"
        onPress={scan}
        loading={scanning}
        disabled={busyId !== null}
        className="py-md"
      />

      {message && (
        <Text className={`text-center ${message.ok ? 'text-live' : 'text-fault'}`}>{message.text}</Text>
      )}

      {tags.map((tag) => (
        <TagCard
          key={tag.id}
          tag={tag}
          busy={busyId === tag.id}
          locked={scanning || busyId !== null}
          run={run}
          onRenamed={(id, name) => setTags((prev) => prev.map((t) => (t.id === id ? { ...t, name } : t)))}
          onMessage={(ok, text) => setMessage({ ok, text })}
        />
      ))}

      {tags.length === 0 && !scanning && (
        <Card>
          <View className="items-center py-lg">
            <Ionicons name="radio-outline" size={40} color={colors.edge} />
            <Text className="mt-md text-lg font-semibold text-text">
              {scanned ? 'No tags in range' : 'No tags found yet'}
            </Text>
            <Text className="mt-xs text-center text-dim">
              {scanned
                ? 'Make sure the ESP32 is powered and flashed with the Crintx firmware, then scan again.'
                : 'Power on an ESP32 or mini ESP32, keep it close, and tap Scan.'}
            </Text>
          </View>
        </Card>
      )}
    </Screen>
  );
}
