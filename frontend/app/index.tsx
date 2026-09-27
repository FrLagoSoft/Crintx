import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../src/api';
import type { Tag } from '../src/ble';
import { shortId } from '../src/buildId';
import { API_CONFIGURED } from '../src/config';
import { HistoryPage } from '../src/pages/HistoryPage';
import { SettingsPage } from '../src/pages/SettingsPage';
import { TagsPage } from '../src/pages/TagsPage';
import { useBoot } from '../src/splashgate';

const PAGES = ['Crintx', 'Buzzer History', 'Settings + AI'];

/** The three swipeable pages, with the phone identity and page dots underneath. */
export default function Home() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { buildId } = useBoot();
  const pager = useRef<ScrollView>(null);
  // A horizontal ScrollView doesn't give its pages a height, so their flex-1
  // trays collapsed to nothing. Measure the pager and hand each page its height.
  const [pageHeight, setPageHeight] = useState(0);
  const [page, setPage] = useState(0);
  const [showFullId, setShowFullId] = useState(false);
  const [server, setServer] = useState<'checking' | 'up' | 'down' | 'unset'>(API_CONFIGURED ? 'checking' : 'unset');

  // Shared by the Crintx page (scans) and Settings (sends levels to the scanned tags).
  const [tags, setTags] = useState<Tag[]>([]);
  const [bleBusy, setBleBusy] = useState(false);

  useEffect(() => {
    if (!API_CONFIGURED) return;
    api.health()
      .then((r) => setServer(r?.status === 'UP' ? 'up' : 'down'))
      .catch(() => setServer('down'));
  }, []);

  const goTo = (i: number) => pager.current?.scrollTo({ x: i * width, animated: true });

  return (
    <View className="flex-1 bg-void" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <ScrollView
        ref={pager}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        style={{ flex: 1 }}
        onLayout={(e) => setPageHeight(e.nativeEvent.layout.height)}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
      >
        {pageHeight > 0 && (
          <>
            <TagsPage width={width} height={pageHeight} tags={tags} setTags={setTags} bleBusy={bleBusy} setBleBusy={setBleBusy} />
            <HistoryPage width={width} height={pageHeight} active={page === 1} />
            <SettingsPage width={width} height={pageHeight} tags={tags} bleBusy={bleBusy} setBleBusy={setBleBusy} />
          </>
        )}
      </ScrollView>

      <View className="items-center pb-md">
        <Pressable onLongPress={() => setShowFullId((v) => !v)} accessibilityHint="Hold to show the full ID">
          <Text className="font-title text-3xl text-ink" selectable={showFullId}>
            {showFullId ? buildId : `Phone ${shortId(buildId)}`}
          </Text>
        </Pressable>
        <View className="mt-xs flex-row items-center gap-xs">
          <View className={`h-2 w-2 rounded-pill ${server === 'up' ? 'bg-live' : server === 'down' ? 'bg-fault' : 'bg-dim'}`} />
          <Text className="font-mono text-[10px] text-dim">
            {{ up: 'Server connected', down: 'Server offline', checking: 'Checking server…', unset: 'Server address not set' }[server]}
          </Text>
        </View>

        <View className="mt-md flex-row gap-md">
          {PAGES.map((name, i) => (
            <Pressable
              key={name}
              onPress={() => goTo(i)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Go to ${name}`}
              accessibilityState={{ selected: page === i }}
              // Matches the mockup: the current page's dot is the pale one.
              className={`h-6 w-6 rounded-pill ${page === i ? 'bg-soft' : 'bg-signal'}`}
            />
          ))}
        </View>
      </View>
    </View>
  );
}
