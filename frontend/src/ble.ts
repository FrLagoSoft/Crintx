import { PermissionsAndroid, Platform } from 'react-native';
import { BleManager, State, type Device } from 'react-native-ble-plx';
import { BLE } from './config';

/**
 * Everything the app does with the ESP32 tags over Bluetooth. The byte format
 * is defined in firmware/README.md; the UUIDs live in src/config.ts.
 */

export type Tag = { id: string; name: string; rssi: number | null };

// Created on first use, so the app still opens in Expo Go (which has no Bluetooth).
let manager: BleManager | null = null;
function ble(): BleManager {
  if (!manager) {
    try {
      manager = new BleManager();
    } catch {
      throw new Error('Bluetooth needs the Crintx dev build. It can’t run in Expo Go.');
    }
  }
  return manager;
}

// ---- Setup ------------------------------------------------------------------

async function ensurePermissions() {
  if (Platform.OS !== 'android') return; // iOS asks on its own the first time
  const P = PermissionsAndroid.PERMISSIONS;
  const wanted =
    Number(Platform.Version) >= 31
      ? [P.BLUETOOTH_SCAN, P.BLUETOOTH_CONNECT, P.ACCESS_FINE_LOCATION]
      : [P.ACCESS_FINE_LOCATION];
  const result = await PermissionsAndroid.requestMultiple(wanted);
  if (wanted.some((p) => result[p] !== PermissionsAndroid.RESULTS.GRANTED)) {
    throw new Error('Bluetooth permission was denied. Allow it in Settings → Apps → Crintx.');
  }
}

async function ensurePoweredOn() {
  const m = ble();
  if ((await m.state()) === State.PoweredOn) return;
  await new Promise<void>((resolve, reject) => {
    const sub = m.onStateChange((s) => {
      if (s !== State.PoweredOn) return;
      clearTimeout(timer);
      sub.remove();
      resolve();
    });
    const timer = setTimeout(() => {
      sub.remove();
      reject(new Error('Turn on Bluetooth and try again.'));
    }, 4000);
  });
}

// ---- Scanning ---------------------------------------------------------------

/**
 * Finds tags for `ms` milliseconds, calling onTag for each one seen. Filters by
 * the Crintx service UUID, never by name, because tags can be renamed.
 */
export async function scanForTags(onTag: (tag: Tag) => void, ms = 6000): Promise<void> {
  await ensurePermissions();
  await ensurePoweredOn();
  const m = ble();
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      m.stopDeviceScan();
      resolve();
    }, ms);
    m.startDeviceScan([BLE.SERVICE_UUID], null, (error, device) => {
      if (error) {
        clearTimeout(timer);
        m.stopDeviceScan();
        reject(new Error(error.message));
        return;
      }
      if (device) onTag(toTag(device));
    });
  });
}

export function stopScan() {
  manager?.stopDeviceScan();
}

// localName comes fresh from the scan response; `name` can be a cached old one.
const toTag = (d: Device): Tag => ({ id: d.id, name: d.localName ?? d.name ?? 'Unnamed tag', rssi: d.rssi });

// ---- Talking to one tag -----------------------------------------------------

/** Connect, run one operation, always disconnect. Tags only hold one phone at a time. */
async function withTag<T>(id: string, run: (m: BleManager) => Promise<T>): Promise<T> {
  await ensurePermissions();
  await ensurePoweredOn();
  const m = ble();
  try {
    const device = await m.connectToDevice(id, { timeout: 8000 });
    await device.discoverAllServicesAndCharacteristics();
  } catch {
    m.cancelDeviceConnection(id).catch(() => {});
    throw new Error('Couldn’t connect. Move closer to the tag and try again.');
  }
  try {
    return await run(m);
  } finally {
    m.cancelDeviceConnection(id).catch(() => {});
  }
}

function write(m: BleManager, id: string, charUuid: string, bytes: number[]) {
  return m.writeCharacteristicWithResponseForDevice(id, BLE.SERVICE_UUID, charUuid, toBase64(bytes));
}

const tenths = (ms: number) => Math.min(20, Math.max(1, Math.round(ms / 100))); // firmware caps at 2 s

/** Motor + buzzer. Without `ms`, the tag uses its own default length. */
export function buzz(id: string, ms?: number) {
  const bytes = ms == null ? [BLE.CMD_BUZZ] : [BLE.CMD_BUZZ, tenths(ms)];
  return withTag(id, (m) => write(m, id, BLE.COMMAND_CHAR_UUID, bytes));
}

/** Buzzer-only square wave: on/off times in microseconds (0–65535). For the sound tests. */
export function playWave(id: string, onUs: number, offUs: number, ms = 1000) {
  const u16 = (n: number) => {
    const v = Math.min(65535, Math.max(0, Math.round(n)));
    return [v & 0xff, v >> 8];
  };
  const bytes = [BLE.CMD_WAVE, ...u16(onUs), ...u16(offUs), tenths(ms)];
  return withTag(id, (m) => write(m, id, BLE.COMMAND_CHAR_UUID, bytes));
}

/** Easter egg: the tag plays "Happy Birthday" (~10 s). Tags on older firmware ignore it. */
export function playSong(id: string) {
  return withTag(id, (m) => write(m, id, BLE.COMMAND_CHAR_UUID, [BLE.CMD_SONG]));
}

/** Throws a readable message if the tag would reject this name. */
export function validateName(name: string): string {
  const n = name.trim();
  if (n.length === 0) throw new Error('Name can’t be empty.');
  if (n.length > BLE.NAME_MAX_LEN) throw new Error(`Name must be ${BLE.NAME_MAX_LEN} characters or fewer.`);
  if (!/^[\x20-\x7E]+$/.test(n)) throw new Error('Use plain letters, numbers and symbols (no emoji or accents).');
  return n;
}

/** Saves the name on the tag. It restarts (~0.5 s) and advertises the new name. */
export function renameTag(id: string, name: string) {
  const n = validateName(name);
  const bytes = Array.from(n, (c) => c.charCodeAt(0));
  return withTag(id, (m) => write(m, id, BLE.NAME_CHAR_UUID, bytes));
}

export function readName(id: string): Promise<string> {
  return withTag(id, async (m) => {
    const c = await m.readCharacteristicForDevice(id, BLE.SERVICE_UUID, BLE.NAME_CHAR_UUID);
    return String.fromCharCode(...fromBase64(c.value ?? ''));
  });
}

/** 0 = off, 100 = full. Saved on the tag itself, so every phone sees the same levels. */
export type Levels = { buzzer: number; motor: number };

export function readLevels(id: string): Promise<Levels> {
  return withTag(id, async (m) => {
    const c = await m.readCharacteristicForDevice(id, BLE.SERVICE_UUID, BLE.LEVELS_CHAR_UUID);
    const [buzzer = 100, motor = 100] = fromBase64(c.value ?? '');
    return { buzzer, motor };
  });
}

/** Saves both levels on the tag; it plays a short preview buzz at the new levels. */
export function setLevels(id: string, { buzzer, motor }: Levels) {
  const pct = (n: number) => Math.min(100, Math.max(0, Math.round(n)));
  return withTag(id, (m) => write(m, id, BLE.LEVELS_CHAR_UUID, [pct(buzzer), pct(motor)]));
}

// ---- base64 (the BLE library's wire format) ---------------------------------

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function toBase64(bytes: number[]): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const [a, b = 0, c = 0] = bytes.slice(i, i + 3);
    const n = (a << 16) | (b << 8) | c;
    out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63];
    out += i + 1 < bytes.length ? B64[(n >> 6) & 63] : '=';
    out += i + 2 < bytes.length ? B64[n & 63] : '=';
  }
  return out;
}

function fromBase64(s: string): number[] {
  const clean = s.replace(/=+$/, '');
  const out: number[] = [];
  let buf = 0;
  let bits = 0;
  for (const ch of clean) {
    buf = (buf << 6) | B64.indexOf(ch);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out.push((buf >> bits) & 0xff);
    }
  }
  return out;
}
