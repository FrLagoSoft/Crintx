import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BuzzMap } from '../src/components/BuzzMap';
import { Button } from '../src/components/Button';
import {
  describePlace,
  distanceMeters,
  formatCoords,
  formatDistance,
  timeAgo,
  watchFix,
  type Fix,
} from '../src/location';
import { colors } from '../src/theme';

/** One logged buzz on the map, with how far you are from it right now. */
export default function LogScreen() {
  const params = useLocalSearchParams<{ lat: string; lng: string; tag?: string; time?: string; acc?: string }>();
  const insets = useSafeAreaInsets();
  const point = useMemo(() => ({ latitude: Number(params.lat), longitude: Number(params.lng) }), [params.lat, params.lng]);
  const [me, setMe] = useState<Fix | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [place, setPlace] = useState<string | null>(null);

  useEffect(() => {
    describePlace(point).then(setPlace);
    let stop: (() => void) | undefined;
    let left = false;
    watchFix(setMe)
      .then((s) => (left ? s() : (stop = s)))
      .catch((e) => setGpsError(e?.message ?? 'Location unavailable.'));
    return () => {
      left = true;
      stop?.();
    };
  }, [point]);

  const away = me ? distanceMeters(point, me) : null;

  return (
    <View className="flex-1 bg-void">
      <BuzzMap lastBuzz={point} me={me} fly />

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
          <Text className="font-heading text-2xl text-ink">{params.tag ?? 'Location'}</Text>
          {params.time && <Text className="font-mono text-xs text-dim">Buzzed {timeAgo(params.time)}</Text>}

          <Text className="mt-md font-title text-4xl text-ink">{away != null ? formatDistance(away) : '—'}</Text>
          <Text className="font-mono text-xs text-dim">
            {away != null ? 'from where you are now' : gpsError ?? 'Finding your location…'}
          </Text>

          <Text className="mt-md font-mono text-sm text-ink" selectable>{formatCoords(point)}</Text>
          <Text className="mt-xs font-mono text-xs text-dim">{place ?? 'Looking up the address…'}</Text>
          {!!params.acc && (
            <Text className="mt-xs font-mono text-xs text-dim">GPS accurate to ±{Math.round(Number(params.acc))} m</Text>
          )}

          <Button label="Done" onPress={() => router.back()} className="mt-md" />
        </View>
      </View>
    </View>
  );
}
