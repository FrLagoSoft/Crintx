import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { shortId } from '../../src/buildId';
import { Card, Screen } from '../../src/components/Screen';
import { API_URL } from '../../src/config';
import { useBoot } from '../../src/splashgate';

const mono = { fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }) };

type Status = 'idle' | 'checking' | 'up' | 'down';

const STATUS = {
  idle: { dot: 'bg-dim', text: 'Not checked yet' },
  checking: { dot: 'bg-dim', text: 'Checking…' },
  up: { dot: 'bg-live', text: 'Server is reachable' },
  down: { dot: 'bg-fault', text: "Can't reach the server" },
} as const;

export default function SetupScreen() {
  const { buildId } = useBoot();
  const [status, setStatus] = useState<Status>('idle');

  async function checkServer() {
    setStatus('checking');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(`${API_URL}/health`, { signal: controller.signal });
      setStatus(res.ok ? 'up' : 'down');
    } catch {
      setStatus('down');
    } finally {
      clearTimeout(timer);
    }
  }

  return (
    <Screen title="Setup" subtitle="This phone's identity and connection.">
      <Card label="This phone">
        <Text className="text-3xl font-bold tracking-widest text-signal" style={mono}>{shortId(buildId)}</Text>
        <Text className="mt-xs text-xs text-dim" style={mono} selectable>{buildId}</Text>
        <Text className="mt-md text-dim">
          Anonymous build ID, created on first launch. No account needed; the server uses it to tell phones apart.
        </Text>
      </Card>

      <Card label="Server">
        <Text className="text-text" style={mono} selectable>{API_URL}</Text>
        <View className="mt-md flex-row items-center gap-sm">
          <View className={`h-2.5 w-2.5 rounded-pill ${STATUS[status].dot}`} />
          <Text className="text-dim">{STATUS[status].text}</Text>
        </View>
        <Pressable
          onPress={checkServer}
          disabled={status === 'checking'}
          className="mt-md items-center rounded-pill border border-edge py-sm active:bg-edge"
        >
          <Text className="font-semibold text-text">Test connection</Text>
        </Pressable>
        <Text className="mt-sm text-xs text-dim">Set EXPO_PUBLIC_API_URL in .env to your laptop's LAN IP.</Text>
      </Card>
    </Screen>
  );
}
