#pragma once

// =============================================================================
// Crintx tag configuration. Everything you'd want to tweak lives here.
// =============================================================================

// ---- Pins -------------------------------------------------------------------
// Same wiring on the full ESP32 and the mini boards (ESP32-C3 SuperMini,
// D1 mini ESP32). If a board lacks one of these, change it here only.
#define MOTOR_PIN   4   // NEVER straight to the motor: GPIO -> 1k -> transistor, flyback diode across motor
#define BUZZER_PIN  5   // buzzer + to this pin, - to GND

// ---- Buzz behavior ----------------------------------------------------------
#define BUZZ_MS        1200  // default buzz length when the app doesn't say
#define MAX_BURST_MS   2000  // cap for any single buzz/test. The sound tests busy-wait,
                             // and single-core boards (C3) reset if that runs ~5s.
#define PREVIEW_MS      300  // short buzz played after the app changes a level

// ---- Levels: buzzer volume + vibration strength ----------------------------
// Both are driven with fast PWM: same voltage, switched on/off faster than you
// can hear. The on-fraction ("duty") sets how loud / how strong.
#define PWM_FREQ_HZ  20000   // above human hearing, so the switching itself is silent
#define PWM_BITS     10      // duty resolution (0..1024)
//
// Level 0 = off. Levels 1..100 map to MIN_DUTY%..100% duty. Below its minimum,
// an active buzzer sputters or cuts out and a coin motor stalls. Find yours with
// the Serial command `raw <buzzer%> <motor%>` and set these to the lowest
// values that still work cleanly.
#define BUZZER_MIN_DUTY  8
#define MOTOR_MIN_DUTY   35
#define DEFAULT_BUZZER_LEVEL  100
#define DEFAULT_MOTOR_LEVEL   100

// ---- Bluetooth contract -----------------------------------------------------
// These MUST match frontend/src/config.ts. Change them in both places or not at all.
#define SERVICE_UUID       "a6c32c26-0bda-4c27-8458-3a8b5a9da013"
#define COMMAND_CHAR_UUID  "b62195c8-9a1d-4d43-b3a4-aa061b751041"  // write: buzz / test commands
#define NAME_CHAR_UUID     "a00cf118-5df4-42f7-af86-3e272d881631"  // read/write: the tag's name
#define LEVELS_CHAR_UUID   "ca83ff33-6353-4c51-971d-96d17289199f"  // read/write: [buzzer 0-100, motor 0-100]

#define DEFAULT_NAME_PREFIX  "Crintx-"  // default name = prefix + last 4 hex of the chip's MAC
#define NAME_MAX_LEN         20         // fits in the scan response next to the 128-bit UUID

// ---- Radio ------------------------------------------------------------------
// BLE always runs in the 2.4 GHz band and hops channels by itself; there is no
// frequency to pick. What you CAN tune is how often the tag announces itself
// and how loud (far) it transmits.
//
// Advertising interval, in units of 0.625 ms. Shorter = the phone finds it
// faster, but the battery drains faster.
#define ADV_INTERVAL_MIN  0x00A0  // 160 * 0.625 = 100 ms
#define ADV_INTERVAL_MAX  0x0140  // 320 * 0.625 = 200 ms
//
// Transmit power. ESP_PWR_LVL_N12 (weakest, ~few meters) ... ESP_PWR_LVL_P9
// (strongest). Lower it on the demo table if tags keep answering from across
// the room.
#define TX_POWER  ESP_PWR_LVL_P9
