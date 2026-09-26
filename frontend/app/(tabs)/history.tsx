import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { api, type LocationPoint } from '../../src/api';
import { BuzzMap } from '../../src/components/BuzzMap';
import { Button } from '../../src/components/Button';
import { Card, Screen } from '../../src/components/Screen';
import {
  buzzTagName,
  describePlace,
  distanceMeters,
  formatDistance,
  timeAgo,
  watchFix,
  type Fix,
} from '../../src/location';
import { colors } from '../../src/theme';

export default function HistoryScreen() {
  const [latest, setLatest] = useState<LocationPoint | null | undefined>(undefined); // undefined = not loaded yet
  const [history, setHistory] = useState<LocationPoint[]>([]);
  const [place, setPlace] = useState<string | null>(null);
  const [me, setMe] = useState<Fix | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [last, recent] = await Promise.all([api.latestLocation(), api.locationHistory(20)]);
      setLatest(last);
      setHistory(recent);
      setPlace(null);
      if (last) describePlace(last).then(setPlace);
    } catch (e: any) {
      setError(e?.message ?? 'Couldn’t load your buzz history.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload and follow your position only while this tab is on screen.
  useFocusEffect(
    useCallback(() => {
      load();
      let stop: (() => void) | undefined;
      let left = false;
      setGpsError(null);
      watchFix(setMe)
        .then((s) => (left ? s() : (stop = s)))
        .catch((e) => setGpsError(e?.message ?? 'Location unavailable.'));
      return () => {
        left = true;
        stop?.();
      };
    }, [load])
  );

  const lastBuzz = useMemo(
    () => (latest ? { latitude: latest.latitude, longitude: latest.longitude } : null),
    [latest]
  );
  const away = latest && me ? distanceMeters(latest, me) : null;

  return (
    <Screen title="History" subtitle="Where you last buzzed, and how far you are from it now.">
      {error && <Text className="text-center text-fault">{error}</Text>}

      {latest === undefined && !error && (
        <Card>
          <Text className="py-lg text-center text-dim">Loading your buzzes…</Text>
        </Card>
      )}

      {latest === null && (
        <Card>
          <View className="items-center py-lg">
            <Ionicons name="map-outline" size={40} color={colors.edge} />
            <Text className="mt-md text-lg font-semibold text-text">Nothing logged yet</Text>
            <Text className="mt-xs text-center text-dim">
              Buzz a tag from the Tags tab. Where you were shows up here.
            </Text>
          </View>
        </Card>
      )}

      {latest && (
        <>
          <BuzzMap lastBuzz={lastBuzz} me={me} height={260} />

          <Card label="Last buzz">
            <Text className="text-4xl font-bold text-text">{away != null ? formatDistance(away) : '—'}</Text>
            <Text className="text-dim">
              {away != null ? 'from where you are now' : gpsError ?? 'Finding your location…'}
            </Text>

            <View className="mt-md gap-xs">
              <Row icon="radio-outline" text={buzzTagName(latest.activityType) ?? 'Unknown tag'} />
              <Row icon="time-outline" text={timeAgo(latest.timestamp)} />
              {place && <Row icon="location-outline" text={place} />}
              {latest.accuracy != null && <Row icon="locate-outline" text={`GPS accurate to ±${Math.round(latest.accuracy)} m`} />}
            </View>
          </Card>
        </>
      )}

      <Button label="Refresh" icon="refresh-outline" variant="outline" onPress={load} loading={loading} />

      {history.length > 1 && (
        <Card label="Recent buzzes">
          {history.map((p, i) => (
            <View key={p.id} className={`flex-row items-center py-sm ${i > 0 ? 'border-t border-edge' : ''}`}>
              <View className="flex-1">
                <Text className="text-text">{buzzTagName(p.activityType) ?? 'Location'}</Text>
                <Text className="text-xs text-dim">{timeAgo(p.timestamp)}</Text>
              </View>
              {me && <Text className="text-dim">{formatDistance(distanceMeters(p, me))}</Text>}
            </View>
          ))}
        </Card>
      )}
    </Screen>
  );
}

function Row({ icon, text }: { icon: React.ComponentProps<typeof Ionicons>['name']; text: string }) {
  return (
    <View className="flex-row items-center gap-sm">
      <Ionicons name={icon} size={16} color={colors.dim} />
      <Text className="flex-1 text-dim">{text}</Text>
    </View>
  );
}
