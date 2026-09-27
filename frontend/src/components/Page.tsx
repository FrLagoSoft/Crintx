import type { ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Button } from './Button';

type Action = { label: string; onPress: () => void; loading?: boolean; disabled?: boolean };

type Props = {
  title: string;
  subtitle: string;
  action: Action;
  /** One status line under the action button (success or error). */
  message?: { ok: boolean; text: string } | null;
  width: number; // one screen wide, set by the pager
  height: number; // measured by the pager (a horizontal ScrollView gives pages no height)
  children: ReactNode; // tray contents
};

/** Content stays phone-width and centered on tablets, like the mockup. */
const MAX_CONTENT_WIDTH = 520;

/** One pager page: title + underline, the peach tray, the action button. */
export function Page({ title, subtitle, action, message, width, height, children }: Props) {
  return (
    <View style={{ width, height }} className="items-center px-md">
      <View style={{ flex: 1, width: '100%', maxWidth: MAX_CONTENT_WIDTH }}>
        <View className="items-center pt-lg pb-md">
          <Text className="font-title text-5xl text-ink">{title}</Text>
          <Text className="mt-xs font-mono text-sm text-ink">{subtitle}</Text>
          <View className="mt-xs h-1 w-44 rounded-pill bg-ink" />
        </View>

        <View style={{ flex: 1 }} className="overflow-hidden rounded-tray bg-tray">
          <ScrollView style={{ flex: 1 }} contentContainerClassName="gap-sm p-sm" nestedScrollEnabled>
            {children}
          </ScrollView>
        </View>

        <Button {...action} className="mt-lg py-md" />
        <Text className={`mt-sm min-h-10 text-center font-mono text-xs ${message?.ok === false ? 'text-fault' : 'text-dim'}`}>
          {message?.text ?? ''}
        </Text>
      </View>
    </View>
  );
}

/** Centered hint inside an empty tray. */
export function TrayHint({ title, body }: { title: string; body: string }) {
  return (
    <View className="items-center px-md py-xl">
      <Text className="font-heading text-xl text-ink">{title}</Text>
      <Text className="mt-xs text-center font-mono text-xs text-dim">{body}</Text>
    </View>
  );
}
