import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { api, type LocationPoint } from '../api';
import { Page, TrayHint } from '../components/Page';
import { timeAgo } from '../location';
import { loadTagNames, tagNameFor } from '../tagNames';
import { colors } from '../theme';
import { Button } from '../components/Button';

/** Opens the map for one logged buzz. */
export function openLog(p: LocationPoint, tag: string) {
  router.push({
    pathname: '/log',
    params: { lat: String(p.latitude), lng: String(p.longitude), tag, time: p.timestamp },
  });
}

type Props = { width: number; height: number; active: boolean };

export function HistoryPage({ width, height, active }: Props) {
  const [history, setHistory] = useState<LocationPoint[] | null>(null); // null = not loaded yet
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const [points, tagNames] = await Promise.all([api.locationHistory(20), loadTagNames()]);
      setNames(tagNames);
      setHistory(points);
    } catch (e: any) {
      setMessage({ ok: false, text: e?.message ?? 'Couldn’t load your history.' });
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh every time you swipe to this page, so new buzzes show up.
  useEffect(() => {
    if (active) load();
  }, [active, load]);

  function openLatest() {
    if (history?.length) openLog(history[0], tagNameFor(history[0], names));
    else setMessage({ ok: false, text: 'Nothing logged yet. Buzz a tag first.' });
  }

  return (
    <Page
      width={width}
      height={height}
      title="Buzzer History"
      subtitle="Finding made easier"
      action={{ label: 'Most Recent History', onPress: openLatest, disabled: loading && !history }}
      message={message}
    >
      <Button icon="sparkles-outline" label="Ask AI about my history" onPress={() => router.push('/ask')} />
      {history === null ? (
        <View className="items-center py-xl">
          {loading ? <ActivityIndicator color={colors.ink} /> : <TrayHint title="Not loaded" body="Swipe here again to retry." />}
        </View>
      ) : history.length === 0 ? (
        <TrayHint title="Nothing logged yet" body="Every buzz is saved with where you were. Buzz a tag and it shows up here." />
      ) : (
        history.map((p) => {
          const tag = tagNameFor(p, names);
          return (
            <Pressable
              key={p.id}
              onPress={() => openLog(p, tag)}
              accessibilityRole="button"
              className="rounded-pill bg-cream p-1 active:opacity-80"
            >
              <View className="rounded-pill bg-ink px-md py-sm">
                <Text className="text-center font-mono text-sm text-cream" numberOfLines={1}>
                  {tag} · {timeAgo(p.timestamp)}
                </Text>
              </View>
            </Pressable>
          );
        })
      )}
    </Page>
  );
}
