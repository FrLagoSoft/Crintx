import '../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NarratorHost } from '../src/narrator';
import { SplashGate } from '../src/splashgate';
import { colors } from '../src/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <SplashGate>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.void } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="buzz" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="log" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen
            name="ask"
            options={{
              headerShown: true,
              title: '', // the screen shows its own big title
              headerStyle: { backgroundColor: colors.void },
              headerTintColor: colors.ink,
              headerShadowVisible: false,
            }}
          />
        </Stack>
        <NarratorHost />
      </SplashGate>
    </SafeAreaProvider>
  );
}
