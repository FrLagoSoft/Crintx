import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text } from 'react-native';
import { setLevels, type Levels, type Tag } from '../ble';
import { LevelSlider } from '../components/LevelSlider';
import { Page } from '../components/Page';
import { loadPrefs, savePrefs, type Prefs } from '../prefs';

type Props = {
  width: number;
  height: number;
  tags: Tag[]; // from the last scan on the Crintx page
  bleBusy: boolean;
  setBleBusy: (busy: boolean) => void;
};

export function SettingsPage({ width, height, tags, bleBusy, setBleBusy }: Props) {
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    loadPrefs().then(setPrefs);
  }, []);

  function update(next: Prefs) {
    setPrefs(next);
    savePrefs(next).catch(() => {});
  }

  /** Save the levels, then send them to every tag found by the last scan (each plays a preview). */
  async function commitLevels(levels: Levels) {
    if (!prefs) return;
    update({ ...prefs, levels });
    if (!tags.length) {
      setMessage({ ok: true, text: 'Saved. Scan for tags to send it to them.' });
      return;
    }
    setBleBusy(true);
    setMessage({ ok: true, text: `Sending to ${tags.length} tag${tags.length > 1 ? 's' : ''}…` });
    const failed: string[] = [];
    for (const tag of tags) {
      try {
        await setLevels(tag.id, levels);
      } catch {
        failed.push(tag.name);
      }
    }
    setBleBusy(false);
    setMessage(
      failed.length
        ? { ok: false, text: `Couldn’t reach ${failed.join(', ')}. Move closer and try again.` }
        : { ok: true, text: `Saved on ${tags.length} tag${tags.length > 1 ? 's' : ''}. Listen for the preview.` }
    );
  }

  function toggleNarration() {
    if (!prefs) return;
    const narration = !prefs.narration;
    update({ ...prefs, narration });
    // TODO(tts): speak buzz results once the text-to-speech server (ai-model branch) is merged.
    setMessage({
      ok: true,
      text: narration ? 'Narration on. It speaks once the text-to-speech server is live.' : 'Narration off.',
    });
  }

  const levels = prefs?.levels ?? { buzzer: 100, motor: 100 };

  return (
    <Page
      width={width}
      height={height}
      title="Settings + AI"
      subtitle="Finding made easiest"
      action={{ label: `Narration Mode: ${prefs?.narration ? 'On' : 'Off'}`, onPress: toggleNarration, disabled: !prefs }}
      message={message}
    >
      <LevelSlider
        label="Volume"
        value={levels.buzzer}
        onChange={(buzzer) => prefs && setPrefs({ ...prefs, levels: { ...levels, buzzer } })}
        onCommit={(buzzer) => commitLevels({ ...levels, buzzer })}
        disabled={!prefs || bleBusy}
      />
      <LevelSlider
        label="Motor"
        value={levels.motor}
        onChange={(motor) => prefs && setPrefs({ ...prefs, levels: { ...levels, motor } })}
        onCommit={(motor) => commitLevels({ ...levels, motor })}
        disabled={!prefs || bleBusy}
      />
      <Pressable
        onPress={() => router.push('/ask')}
        accessibilityRole="button"
        className="h-12 items-center justify-center rounded-pill border-2 border-cream bg-ink active:opacity-80"
      >
        <Text className="font-mono text-sm text-cream">AI Model</Text>
      </Pressable>
    </Page>
  );
}
