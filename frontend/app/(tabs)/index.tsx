import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';
import { Card, Screen } from '../../src/components/Screen';
import { colors } from '../../src/theme';

export default function TagsScreen() {
  // TODO(ble): wire to src/ble.ts — scan for ESP32 tags, list them, buzz on tap.
  const bleReady = false;

  return (
    <Screen title="Tags" subtitle="ESP32 buzzers in Bluetooth range.">
      <Pressable
        disabled={!bleReady}
        className={`flex-row items-center justify-center gap-sm rounded-pill py-md ${bleReady ? 'bg-signal' : 'bg-edge'}`}
      >
        <Ionicons name="scan-outline" size={20} color={bleReady ? colors.void : colors.dim} />
        <Text className={`text-base font-semibold ${bleReady ? 'text-void' : 'text-dim'}`}>Scan for tags</Text>
      </Pressable>

      <Card>
        <View className="items-center py-lg">
          <Ionicons name="radio-outline" size={40} color={colors.edge} />
          <Text className="mt-md text-lg font-semibold text-text">No tags found yet</Text>
          <Text className="mt-xs text-center text-dim">
            Power on an ESP32 or mini ESP32 and keep it close. Tags you find show up here, ready to buzz.
          </Text>
        </View>
      </Card>
    </Screen>
  );
}
