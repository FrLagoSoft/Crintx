import type { ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Scrolling page for secondary screens (e.g. AI Model). The stack header above
 * it handles the top safe area, so this only pads the bottom.
 */
export function Screen({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-void">
      <ScrollView contentContainerClassName="gap-md px-md pb-xl">
        <View className="pb-sm">
          <Text className="font-title text-4xl text-ink">{title}</Text>
          {subtitle && <Text className="mt-xs font-mono text-xs text-dim">{subtitle}</Text>}
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

/** Rounded light card for grouping content. */
export function Card({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <View className="rounded-tile bg-panel p-md">
      {label && <Text className="mb-sm font-mono text-xs tracking-widest text-dim uppercase">{label}</Text>}
      {children}
    </View>
  );
}
