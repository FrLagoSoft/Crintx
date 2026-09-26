import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';
import { colors } from '../../src/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

const icon = (name: IconName) => ({ color, size }: { color: ColorValue; size: number }) =>
  <Ionicons name={name} color={color} size={size} />;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.signal,
        tabBarInactiveTintColor: colors.dim,
        tabBarStyle: { backgroundColor: colors.panel, borderTopColor: colors.edge },
        sceneStyle: { backgroundColor: colors.void },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Tags', tabBarIcon: icon('radio-outline') }} />
      <Tabs.Screen name="history" options={{ title: 'History', tabBarIcon: icon('map-outline') }} />
      <Tabs.Screen name="setup" options={{ title: 'Setup', tabBarIcon: icon('options-outline') }} />
    </Tabs>
  );
}
