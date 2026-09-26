import '../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SplashGate } from '../src/splashgate';
import { colors } from '../src/theme';
import { TrackerProvider } from '../src/tracker/TrackerProvider';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <SplashGate>
        <TrackerProvider>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.void } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="tracker" options={{ headerShown: true, title: "Tracker prototype" }} />
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
        </TrackerProvider>
      </SplashGate>
    </SafeAreaProvider>
  );
}
