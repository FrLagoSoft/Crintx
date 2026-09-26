import * as SplashScreen from 'expo-splash-screen';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { getBuildId } from './buildId';
import { colors } from './theme';

// Keep the native splash up until the JS loading screen below is on screen.
SplashScreen.preventAutoHideAsync().catch(() => {});

type Boot = { buildId: string };

/**
 * Everything the app must finish before the first screen shows. Each step's
 * label appears on the loading screen while it runs. Add steps here (e.g.
 * "Checking Bluetooth", "Reaching server"); keep them fast.
 */
const STEPS: { label: string; run: (boot: Partial<Boot>) => Promise<void> }[] = [
  { label: 'Creating build ID', run: async (b) => { b.buildId = await getBuildId(); } },
];

const MIN_VISIBLE_MS = 700; // long enough to read, short enough not to annoy

const BootContext = createContext<Boot | null>(null);

/** The values the loading screen prepared. Only valid inside <SplashGate>. */
export function useBoot(): Boot {
  const boot = useContext(BootContext);
  if (!boot) throw new Error('useBoot() must be used inside <SplashGate>.');
  return boot;
}

export function SplashGate({ children }: { children: ReactNode }) {
  const [boot, setBoot] = useState<Boot | null>(null);
  const [step, setStep] = useState(STEPS[0]?.label ?? 'Starting');
  const [error, setError] = useState<string | null>(null);
  const [gateGone, setGateGone] = useState(false);
  const fade = useRef(new Animated.Value(1)).current;

  const start = useCallback(async () => {
    setError(null);
    const started = Date.now();
    const draft: Partial<Boot> = {};
    try {
      for (const s of STEPS) {
        setStep(s.label);
        await s.run(draft);
      }
      const wait = MIN_VISIBLE_MS - (Date.now() - started);
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      setBoot(draft as Boot);
      Animated.timing(fade, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => setGateGone(true));
    } catch (e: any) {
      setError(e?.message ?? 'Startup failed.');
    }
  }, [fade]);

  useEffect(() => { start(); }, [start]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.void }}>
      {boot && <BootContext.Provider value={boot}>{children}</BootContext.Provider>}
      {!gateGone && (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade }]}>
          <LoadingScreen step={step} error={error} onRetry={start} />
        </Animated.View>
      )}
    </View>
  );
}

function LoadingScreen({ step, error, onRetry }: { step: string; error: string | null; onRetry: () => void }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    // Same background and mark size as the native splash, so the swap is invisible.
    <View className="flex-1 items-center justify-center bg-void" onLayout={() => SplashScreen.hideAsync().catch(() => {})}>
      <View className="items-center justify-center" style={{ width: 160, height: 160 }}>
        <Animated.View
          style={[
            styles.ring,
            {
              opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
              transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.3] }) }],
            },
          ]}
        />
        <Image source={require('../assets/loading-icon.png')} style={{ width: 160, height: 160 }} />
      </View>

      <View className="absolute bottom-xl items-center px-lg">
        {error ? (
          <>
            <Text className="text-center text-fault">{error}</Text>
            <Pressable onPress={onRetry} className="mt-md rounded-pill border border-edge px-lg py-sm">
              <Text className="font-semibold text-text">Try again</Text>
            </Pressable>
          </>
        ) : (
          <Text className="text-sm tracking-widest text-dim uppercase">{step}…</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: colors.signal,
  },
});
