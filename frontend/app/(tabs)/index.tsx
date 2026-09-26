import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { buzz, renameTag, scanForTags, stopScan, validateName, type Tag } from '../../src/ble';
import { Button } from '../../src/components/Button';
import { Card, Screen } from '../../src/components/Screen';
import { BLE } from '../../src/config';
import { colors } from '../../src/theme';

function signal(rssi: number | null) {
  if (rssi == null) return 'Signal unknown';
  if (rssi >= -60) return `Very close · ${rssi} dBm`;
  if (rssi >= -75) return `Nearby · ${rssi} dBm`;
  return `Far · ${rssi} dBm`;
}

export default function TagsScreen() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => stopScan, []);

  async function scan() {
    setScanning(true);
    setMessage(null);
    setEditingId(null);
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

  async function run(id: string, action: () => Promise<unknown>, success: string) {
    setBusyId(id);
    setMessage(null);
    try {
      await action();
      setMessage({ ok: true, text: success });
      return true;
    } catch (e: any) {
      setMessage({ ok: false, text: e?.message ?? 'Something went wrong.' });
      return false;
    } finally {
      setBusyId(null);
    }
  }

  async function saveName(tag: Tag) {
    let name: string;
    try {
      name = validateName(draft);
    } catch (e: any) {
      setMessage({ ok: false, text: e.message });
      return;
    }
    const ok = await run(tag.id, () => renameTag(tag.id, name), `Renamed to “${name}”. It restarts in a second.`);
    if (ok) {
      setTags((prev) => prev.map((t) => (t.id === tag.id ? { ...t, name } : t)));
      setEditingId(null);
    }
  }

  const locked = scanning || busyId !== null;

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
        <Card key={tag.id}>
          <View className="flex-row items-center gap-md">
            <Ionicons name="radio-outline" size={28} color={colors.signal} />
            <View className="flex-1">
              <Text className="text-lg font-semibold text-text">{tag.name}</Text>
              <Text className="text-xs text-dim">{signal(tag.rssi)}</Text>
            </View>
          </View>

          {editingId === tag.id ? (
            <View className="mt-md gap-sm">
              <TextInput
                value={draft}
                onChangeText={setDraft}
                maxLength={BLE.NAME_MAX_LEN}
                autoFocus
                autoCorrect={false}
                placeholder="New name"
                placeholderTextColor={colors.dim}
                onSubmitEditing={() => saveName(tag)}
                className="rounded-card border border-edge bg-void px-md py-sm text-text"
              />
              <View className="flex-row gap-sm">
                <Button label="Cancel" variant="outline" onPress={() => setEditingId(null)} disabled={locked} className="flex-1" />
                <Button label="Save" onPress={() => saveName(tag)} loading={busyId === tag.id} disabled={locked} className="flex-1" />
              </View>
            </View>
          ) : (
            <View className="mt-md flex-row gap-sm">
              <Button
                label="Buzz"
                icon="notifications-outline"
                onPress={() => run(tag.id, () => buzz(tag.id), `Buzzed ${tag.name}.`)}
                loading={busyId === tag.id}
                disabled={locked}
                className="flex-1"
              />
              <Button
                label="Rename"
                icon="pencil-outline"
                variant="outline"
                onPress={() => {
                  setDraft(tag.name);
                  setEditingId(tag.id);
                  setMessage(null);
                }}
                disabled={locked}
                className="flex-1"
              />
            </View>
          )}
        </Card>
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
