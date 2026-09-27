import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { buzz, renameTag, scanForTags, stopScan, validateName, type Tag } from '../ble';
import { Page, TrayHint } from '../components/Page';
import { RenameSheet } from '../components/RenameSheet';
import { TagTile } from '../components/TagTile';

type Props = {
  width: number;
  height: number;
  tags: Tag[];
  setTags: React.Dispatch<React.SetStateAction<Tag[]>>;
  bleBusy: boolean; // shared across pages: tags hold one connection at a time
  setBleBusy: (busy: boolean) => void;
};

export function TagsPage({ width, height, tags, setTags, bleBusy, setBleBusy }: Props) {
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<Tag | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => stopScan, []);

  async function scan() {
    setScanning(true);
    setBleBusy(true);
    setMessage(null);
    setTags([]);
    try {
      await scanForTags((tag) =>
        setTags((prev) =>
          [...prev.filter((t) => t.id !== tag.id), tag].sort((a, b) => (b.rssi ?? -999) - (a.rssi ?? -999))
        )
      );
    } catch (e: any) {
      setMessage({ ok: false, text: e?.message ?? 'Scan failed.' });
    } finally {
      setScanning(false);
      setBleBusy(false);
      setScanned(true);
    }
  }

  /** Runs one Bluetooth action on a tag with shared busy + message handling. */
  async function withBusy(tag: Tag, action: () => Promise<unknown>, success: string) {
    setBusyId(tag.id);
    setBleBusy(true);
    setMessage(null);
    try {
      await action();
      setMessage({ ok: true, text: success });
      return true;
    } catch (e: any) {
      setMessage({ ok: false, text: e?.message ?? 'Something went wrong.' });
      return false;
    } finally {
      setBusyId(null);
      setBleBusy(false);
    }
  }

  async function buzzTag(tag: Tag) {
    if (await withBusy(tag, () => buzz(tag.id), `Buzzed ${tag.name}.`)) {
      router.push({ pathname: '/buzz', params: { tag: tag.name } });
    }
  }

  async function saveName(draft: string) {
    if (!renaming) return;
    let name: string;
    try {
      name = validateName(draft);
    } catch (e: any) {
      setMessage({ ok: false, text: e.message });
      return;
    }
    const tag = renaming;
    if (await withBusy(tag, () => renameTag(tag.id, name), `Renamed to “${name}”.`)) {
      setTags((prev) => prev.map((t) => (t.id === tag.id ? { ...t, name } : t)));
      setRenaming(null);
    }
  }

  return (
    <Page
      width={width}
      height={height}
      title="Crintx"
      subtitle="Finding made easy"
      action={{ label: scanning ? 'Scanning…' : 'Scan for tags!', onPress: scan, loading: scanning, disabled: bleBusy }}
      message={message ?? (tags.length ? { ok: true, text: 'Tap a tag to buzz it · hold to rename' } : null)}
    >
      {tags.length > 0 ? (
        <View className="flex-row flex-wrap justify-between gap-y-sm">
          {tags.map((tag) => (
            <TagTile
              key={tag.id}
              tag={tag}
              busy={busyId === tag.id && !renaming}
              disabled={bleBusy}
              onPress={() => buzzTag(tag)}
              onLongPress={() => setRenaming(tag)}
            />
          ))}
        </View>
      ) : (
        !scanning && (
          <TrayHint
            title={scanned ? 'No tags in range' : 'No tags yet'}
            body={
              scanned
                ? 'Make sure the ESP32 is powered and flashed with the Crintx firmware, then scan again.'
                : 'Power on an ESP32, keep it close, and tap Scan for tags!'
            }
          />
        )
      )}

      <RenameSheet
        name={renaming?.name ?? null}
        saving={renaming !== null && busyId === renaming.id}
        onSave={saveName}
        onClose={() => setRenaming(null)}
      />
    </Page>
  );
}
