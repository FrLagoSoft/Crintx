import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';
import { Card, Screen } from '../../src/components/Screen';
import { colors } from '../../src/theme';

export default function HistoryScreen() {
  // TODO(api): load buzzes from the server via src/api.ts once the endpoints are settled.
  return (
    <Screen title="History" subtitle="Every buzz, with when and where it happened.">
      <Card>
        <View className="items-center py-lg">
          <Ionicons name="time-outline" size={40} color={colors.edge} />
          <Text className="mt-md text-lg font-semibold text-text">Nothing logged yet</Text>
          <Text className="mt-xs text-center text-dim">
            Buzzes from this phone appear here once the server is connected.
          </Text>
        </View>
      </Card>
    </Screen>
  );
}
