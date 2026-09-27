import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BuzzMap } from '../src/components/BuzzMap';
import { Button } from '../src/components/Button';
import { describePlace, formatCoords, getCurrentFix, logBuzzLocation, type Fix } from '../src/location';
import { colors } from '../src/theme';

type Save = { state: 'saving' } | { state: 'saved' } | { state: 'failed'; reason: string };

/**
 * Opens right after a buzz: finds the phone, flies the map in from the whole
 * world to that spot, and logs the point to the server.
 */
export default function BuzzLocationScreen() {
  const { tag = 'Tag' } = useLocalSearchParams<{ tag?: string }>();
  const insets = useSafeAreaInsets();
  const [fix, setFix] = useState<Fix | null>(null);
  const [fixError, setFixError] = useState<string | null>(null);
  const [place, setPlace] = useState<string | null | undefined>(undefined); // undefined = still looking
  const [save, setSave] = useState<Save | null>(null);
  const started = useRef(false); // effects run twice in dev; log the buzz once

  async function saveFix(f: Fix) {
    setSave({ state: 'saving' });
    try {
      await logBuzzLocation(tag, f);
      setSave({ state: 'saved' });
    } catch (e: any) {
      setSave({ state: 'failed', reason: e?.message ?? 'unknown error' });
    }
  }

  async function locate() {
    setFixError(null);
    try {
      const f = await getCurrentFix();
      setFix(f);
      describePlace(f).then(setPlace);
      saveFix(f);
    } catch (e: any) {
      setFixError(e?.message ?? 'Couldn’t get your location.');
    }
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    locate();
  }, []);

  return (
    <View className="flex-1 bg-void">
      <BuzzMap lastBuzz={fix} fly />

      <Pressable
        onPress={() => router.back()}
        accessibilityLabel="Close map"
        className="absolute rounded-pill border-2 border-cream bg-ink p-sm active:opacity-80"
        style={{ top: insets.top + 8, left: 16 }}
      >
        <Ionicons name="close" size={22} color={colors.cream} />
      </Pressable>

      <View className="absolute inset-x-0 bottom-0 px-md" style={{ paddingBottom: insets.bottom + 16 }}>
        <View className="rounded-tray bg-panel p-lg">
          <View className="flex-row items-baseline gap-sm">
            <Text className="flex-1 font-heading text-2xl text-ink">Buzzed {tag}</Text>
            <Text className="font-mono text-xs text-dim">just now</Text>
          </View>

          <View className="mt-md">
            {fix ? (
              <>
                <Text className="font-title text-3xl text-ink" selectable>{formatCoords(fix)}</Text>
                <Text className="mt-xs font-mono text-xs text-dim">{place === undefined ? 'Looking up the address…' : place ?? 'Address unavailable'}</Text>
                {fix.accuracy != null && (
                  <Text className="mt-xs font-mono text-xs text-dim">GPS accurate to ±{Math.round(fix.accuracy)} m</Text>
                )}
              </>
            ) : fixError ? (
              <>
                <Text className="font-mono text-sm text-fault">{fixError}</Text>
                <Button label="Try again" variant="outline" onPress={locate} className="mt-sm" />
              </>
            ) : (
              <View className="flex-row items-center gap-sm">
                <ActivityIndicator color={colors.ink} />
                <Text className="font-mono text-sm text-dim">Finding your location…</Text>
              </View>
            )}
          </View>

          {save && <SaveStatus save={save} onRetry={() => fix && saveFix(fix)} />}

          <View className="mt-md flex-row gap-sm">
            {fix && (
              <Button label="Open in Maps" variant="outline" onPress={() => openInMaps(fix, tag)} className="flex-1" />
            )}
            <Button label="Done" onPress={() => router.back()} className="flex-1" />
          </View>
        </View>
      </View>
    </View>
  );
}

function SaveStatus({ save, onRetry }: { save: Save; onRetry: () => void }) {
  return (
    <View className="mt-md flex-row items-center gap-sm border-t border-edge pt-sm">
      {save.state === 'saving' && <ActivityIndicator size="small" color={colors.dim} />}
      {save.state === 'saved' && <Ionicons name="checkmark-circle" size={18} color={colors.live} />}
      {save.state === 'failed' && <Ionicons name="alert-circle" size={18} color={colors.fault} />}
      <Text className={`flex-1 font-mono text-xs ${save.state === 'failed' ? 'text-fault' : 'text-dim'}`}>
        {save.state === 'saving' && 'Saving to your history…'}
        {save.state === 'saved' && 'Saved on this phone'}
        {save.state === 'failed' && `Not saved: ${save.reason}`}
      </Text>
      {save.state === 'failed' && (
        <Pressable onPress={onRetry} hitSlop={8}>
          <Text className="font-mono text-sm text-ink underline">Retry</Text>
        </Pressable>
      )}
    </View>
  );
}

/** Hands the point to the phone's own maps app, falling back to OpenStreetMap in the browser. */
function openInMaps({ latitude, longitude }: Fix, label: string) {
  const ll = `${latitude},${longitude}`;
  const url =
    Platform.OS === 'ios'
      ? `http://maps.apple.com/?ll=${ll}&q=${encodeURIComponent(label)}`
      : `geo:${ll}?q=${ll}(${encodeURIComponent(label)})`;
  Linking.openURL(url).catch(() =>
    Linking.openURL(`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}`)
  );
}
