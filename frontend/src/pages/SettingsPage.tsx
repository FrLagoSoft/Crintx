import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { setLevels, type Levels, type Tag } from '../ble';
import { LevelSlider } from '../components/LevelSlider';
import { Page } from '../components/Page';
import type { Prefs } from '../prefs';

type Props = {
  width: number;
  height: number;
  tags: Tag[]; // from the last scan on the Crintx page
  bleBusy: boolean;
  setBleBusy: (busy: boolean) => void;
  prefs: Prefs | null; // owned by the home screen (auto-buzz reads them too); null while loading
  /** Update settings. `save: false` = live preview while dragging, not written to storage. */
  onPrefs: (next: Prefs, save?: boolean) => void;
};

const minutes = (v: number) => (v === 0 ? 'Off' : `${v} min`);

export function SettingsPage({ width, height, tags, bleBusy, setBleBusy, prefs, onPrefs }: Props) {
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  /** Save the levels, then send them to every tag found by the last scan (each plays a preview). */
  async function commitLevels(levels: Levels) {
    if (!prefs) return;
    onPrefs({ ...prefs, levels });
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

  function commitAuto(autoMinutes: number) {
    if (!prefs) return;
    onPrefs({ ...prefs, autoMinutes });
    setMessage(
      autoMinutes === 0
        ? { ok: true, text: 'Auto-buzz off.' }
        : {
            ok: true,
            text: `Buzzes your scanned tags every ${autoMinutes} min while Crintx is open. The screen stays on.`,
          }
    );
  }

  function toggleNarration() {
    if (!prefs) return;
    const narration = !prefs.narration;
    onPrefs({ ...prefs, narration });
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
        onChange={(buzzer) => prefs && onPrefs({ ...prefs, levels: { ...levels, buzzer } }, false)}
        onCommit={(buzzer) => commitLevels({ ...levels, buzzer })}
        disabled={!prefs || bleBusy}
      />
      <LevelSlider
        label="Motor"
        value={levels.motor}
        onChange={(motor) => prefs && onPrefs({ ...prefs, levels: { ...levels, motor } }, false)}
        onCommit={(motor) => commitLevels({ ...levels, motor })}
        disabled={!prefs || bleBusy}
      />
      <LevelSlider
        label="Auto"
        value={prefs?.autoMinutes ?? 0}
        min={0}
        max={60}
        step={5}
        format={minutes}
        onChange={(autoMinutes) => prefs && onPrefs({ ...prefs, autoMinutes }, false)}
        onCommit={commitAuto}
        disabled={!prefs}
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
