import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { buzz, readLevels, renameTag, setLevels, validateName, type Levels, type Tag } from '../ble';
import { router } from 'expo-router';
import { BLE } from '../config';
import { colors } from '../theme';
import { Button } from './Button';
import { LevelSlider } from './LevelSlider';
import { Card } from './Screen';

/** Runs one Bluetooth action with shared busy/message handling. `success: null` = no message. */
export type RunAction = (id: string, action: () => Promise<unknown>, success: string | null) => Promise<boolean>;

type Props = {
  tag: Tag;
  busy: boolean; // this tag has an action in flight
  locked: boolean; // any tag (or a scan) is busy
  run: RunAction;
  onRenamed: (id: string, name: string) => void;
  onMessage: (ok: boolean, text: string) => void;
};

function signal(rssi: number | null) {
  if (rssi == null) return 'Signal unknown';
  if (rssi >= -60) return `Very close · ${rssi} dBm`;
  if (rssi >= -75) return `Nearby · ${rssi} dBm`;
  return `Far · ${rssi} dBm`;
}

export function TagCard({ tag, busy, locked, run, onRenamed, onMessage }: Props) {
  const [panel, setPanel] = useState<'rename' | 'levels' | null>(null);
  const [draft, setDraft] = useState('');
  const [levels, setLevelsState] = useState<Levels | null>(null);

  /** Buzz, then open the map screen, which finds and logs where the phone is. */
  async function buzzAndShow() {
    if (!(await run(tag.id, () => buzz(tag.id), `Buzzed ${tag.name}.`))) return;
    router.push({ pathname: '/buzz', params: { tag: tag.name } });
  }

  async function saveName() {
    let name: string;
    try {
      name = validateName(draft);
    } catch (e: any) {
      onMessage(false, e.message);
      return;
    }
    if (await run(tag.id, () => renameTag(tag.id, name), `Renamed to “${name}”. It restarts in a second.`)) {
      onRenamed(tag.id, name);
      setPanel(null);
    }
  }

  async function loadLevels() {
    setLevelsState(null);
    await run(tag.id, async () => setLevelsState(await readLevels(tag.id)), null);
  }

  function toggle(next: 'rename' | 'levels') {
    if (panel === next) return setPanel(null);
    setPanel(next);
    if (next === 'rename') setDraft(tag.name);
    if (next === 'levels') loadLevels();
  }

  function commitLevels(next: Levels) {
    setLevelsState(next);
    run(tag.id, () => setLevels(tag.id, next), 'Saved. Listen for the preview.');
  }

  return (
    <Card>
      <View className="flex-row items-center gap-md">
        <Ionicons name="radio-outline" size={28} color={colors.signal} />
        <View className="flex-1">
          <Text className="text-lg font-semibold text-text">{tag.name}</Text>
          <Text className="text-xs text-dim">{signal(tag.rssi)}</Text>
        </View>
      </View>

      <View className="mt-md flex-row gap-sm">
        <Button
          label="Buzz"
          icon="notifications-outline"
          onPress={buzzAndShow}
          loading={busy && panel === null}
          disabled={locked}
          className="flex-1"
        />
        <Button label="Rename" variant="outline" onPress={() => toggle('rename')} disabled={locked} className="flex-1" />
        <Button label="Levels" variant="outline" onPress={() => toggle('levels')} disabled={locked} className="flex-1" />
      </View>

      {panel === 'rename' && (
        <View className="mt-md gap-sm">
          <TextInput
            value={draft}
            onChangeText={setDraft}
            maxLength={BLE.NAME_MAX_LEN}
            autoFocus
            autoCorrect={false}
            placeholder="New name"
            placeholderTextColor={colors.dim}
            onSubmitEditing={saveName}
            className="rounded-card border border-edge bg-void px-md py-sm text-text"
          />
          <Button label="Save name" onPress={saveName} loading={busy} disabled={locked} />
        </View>
      )}

      {panel === 'levels' && (
        <View className="mt-md gap-md">
          {levels ? (
            <>
              <LevelSlider
                label="Buzzer volume"
                icon="volume-high-outline"
                value={levels.buzzer}
                onChange={(buzzer) => setLevelsState({ ...levels, buzzer })}
                onCommit={(buzzer) => commitLevels({ ...levels, buzzer })}
                disabled={locked}
              />
              <LevelSlider
                label="Vibration"
                icon="phone-portrait-outline"
                value={levels.motor}
                onChange={(motor) => setLevelsState({ ...levels, motor })}
                onCommit={(motor) => commitLevels({ ...levels, motor })}
                disabled={locked}
              />
              <Text className="text-xs text-dim">
                Saved on the tag, so every phone gets the same levels. Set one to Off for silent or vibrate-free alerts.
              </Text>
            </>
          ) : busy ? (
            <Text className="text-center text-dim">Reading levels…</Text>
          ) : (
            <Button label="Couldn’t read levels. Retry" variant="outline" onPress={loadLevels} disabled={locked} />
          )}
        </View>
      )}
    </Card>
  );
}
