import '../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SplashGate } from '../src/splashgate';
import { colors } from '../src/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <SplashGate>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.void } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="buzz" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        </Stack>
      </SplashGate>
    </SafeAreaProvider>
  );
}
