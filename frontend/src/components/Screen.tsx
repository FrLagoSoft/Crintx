import type { ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/** Page shell every tab uses: title, optional subtitle, scrolling body. */
export function Screen({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-void">
      <ScrollView contentContainerClassName="gap-md px-md pb-xl">
        <View className="pt-md pb-sm">
          <Text className="text-3xl font-bold text-text">{title}</Text>
          {subtitle && <Text className="mt-xs text-dim">{subtitle}</Text>}
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

/** Rounded panel for grouping content. */
export function Card({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <View className="rounded-card border border-edge bg-panel p-md">
      {label && <Text className="mb-sm text-xs font-semibold tracking-widest text-dim uppercase">{label}</Text>}
      {children}
    </View>
  );
}
