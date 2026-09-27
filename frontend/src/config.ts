const url = process.env.EXPO_PUBLIC_API_URL?.trim();

/** False until EXPO_PUBLIC_API_URL in frontend/.env holds a real address (not the placeholder). */
export const API_CONFIGURED = !!url && !url.includes('PASTE-');
if (!API_CONFIGURED) {
  console.warn('EXPO_PUBLIC_API_URL is not set. Put the backend URL in frontend/.env, restart with -c.');
}

/** Base URL of the Spring Boot server (may include an API Gateway stage path). Never put secrets in EXPO_PUBLIC_* vars. */
export const API_URL = (url ?? 'http://localhost:8080').replace(/\/+$/, '');

/**
 * CARTO basemaps key (dark map style). Optional: without it the map falls back
 * to plain OpenStreetMap tiles. It ships inside the APK like every EXPO_PUBLIC_*
 * value, so restrict it in the CARTO dashboard and keep it out of committed files
 * (.env.local locally, `eas env` for cloud builds).
 */
export const CARTO_KEY = process.env.EXPO_PUBLIC_CARTO_KEY || null;

/**
 * The Bluetooth contract with the ESP32 tags. MUST match firmware/crintx_tag/config.h.
 * Scan by SERVICE_UUID, not by name: tags can be renamed in the field.
 */
export const BLE = {
  SERVICE_UUID: 'a6c32c26-0bda-4c27-8458-3a8b5a9da013',
  COMMAND_CHAR_UUID: 'b62195c8-9a1d-4d43-b3a4-aa061b751041',
  NAME_CHAR_UUID: 'a00cf118-5df4-42f7-af86-3e272d881631',
  LEVELS_CHAR_UUID: 'ca83ff33-6353-4c51-971d-96d17289199f', // [buzzer 0-100, motor 0-100]
  CMD_BUZZ: 0x01, // [0x01] or [0x01, duration × 100 ms]
  CMD_WAVE: 0x02, // [0x02, onLo, onHi, offLo, offHi, duration × 100 ms], on/off in µs
  CMD_SONG: 0x03, // [0x03] easter egg: "Happy Birthday" rhythm (~10 s); needs the new firmware
  NAME_MAX_LEN: 20,
} as const;
