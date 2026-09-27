import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import type { Tag } from '../ble';
import { colors } from '../theme';

function proximity(rssi: number | null) {
  if (rssi == null) return 'Signal unknown';
  if (rssi >= -60) return `Very close · ${rssi} dB`;
  if (rssi >= -75) return `Nearby · ${rssi} dB`;
  return `Far · ${rssi} dB`;
}

/** "Crintx-A1B2" → "A1", "Kitchen Keys" → "KK", "Bag" → "BA". */
function initials(name: string) {
  const base = name.replace(/^Crintx-/i, '');
  const words = base.split(/[^A-Za-z0-9]+/).filter(Boolean);
  const letters = words.length >= 2 ? words[0][0] + words[1][0] : (words[0] ?? '?').slice(0, 2);
  return letters.toUpperCase();
}

type Props = {
  tag: Tag;
  busy: boolean; // this tile's action is running
  disabled: boolean; // any Bluetooth action (or a scan) is running
  onPress: () => void; // buzz
  onLongPress: () => void; // rename
};

/** One tag in the 2-column grid. Tap buzzes, long-press renames. */
export function TagTile({ tag, busy, disabled, onPress, onLongPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`${tag.name}, ${proximity(tag.rssi)}. Tap to buzz, hold to rename.`}
      className="aspect-square items-center rounded-tile bg-ink p-sm active:opacity-80"
      style={{ width: '48%' }}
    >
      <Text className="font-heading text-lg text-cream" numberOfLines={1}>{tag.name}</Text>
      <Text className="font-mono text-[10px] text-cream opacity-80">{proximity(tag.rssi)}</Text>
      <View className="mt-sm flex-1 items-center justify-center">
        <View className="h-16 w-16 items-center justify-center rounded-pill bg-cream">
          {busy ? (
            <ActivityIndicator color={colors.ink} />
          ) : (
            <Text className="font-mono text-base text-ink">{initials(tag.name)}</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}
