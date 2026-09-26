# Crintx tag firmware

One sketch, `crintx_tag/`, flashed to every ESP32 / mini ESP32. Each tag is a
Bluetooth device with a vibration motor and a buzzer. All settings (pins,
Bluetooth IDs, radio tuning) are in [`crintx_tag/config.h`](crintx_tag/config.h).

## Flashing

- Arduino IDE → Boards Manager → **esp32 by Espressif, v3.x**.
- Pick your board (e.g. *ESP32 Dev Module*, *ESP32C3 Dev Module* for a C3 SuperMini).
- **C3 SuperMini only:** Tools → *USB CDC On Boot* → **Enabled**, or the Serial
  Monitor stays blank.
- Open `crintx_tag/crintx_tag.ino`, upload, open Serial Monitor at **115200**, line ending **Newline**.

No extra libraries: BLE and Preferences come with the esp32 package.

## Wiring

```
Vibration motor (never straight to a pin: it draws ~100 mA and its kickback kills GPIOs)
  GPIO 4 ──[1kΩ]── base of NPN 2N2222   (or gate of a 2N7000 MOSFET)
  motor between +V and collector/drain
  1N4148 diode across the motor, stripe (cathode) toward +V
  emitter/source ── GND

Buzzer
  + ── GPIO 5
  − ── GND
```

## Naming tags in the field

Every tag starts as `Crintx-XXXX` (last 4 hex digits of its chip MAC), so no two
collide. To rename:

- **From the phone:** write 1–20 printable characters to the NAME characteristic.
- **Over USB:** `name Kitchen` in the Serial Monitor. `name reset` goes back to default.

The name is saved in flash, and the tag restarts itself (~0.5 s) to advertise it.
Android sometimes caches old names, so if the phone still shows the old one, rescan.

The app should find tags by the **service UUID**, not by name, since names change.

Heads-up: anyone in Bluetooth range with the app can buzz or rename a tag.
That's fine for a demo; don't rely on it as security.

## Bluetooth protocol

Service `a6c32c26-0bda-4c27-8458-3a8b5a9da013`

| Characteristic | UUID | Access | Bytes |
|---|---|---|---|
| COMMAND | `b62195c8-9a1d-4d43-b3a4-aa061b751041` | write | `01` buzz default length · `01 tt` buzz tt×100 ms · `02 onLo onHi offLo offHi tt` buzzer wave, on/off in µs (little-endian), tt×100 ms |
| NAME | `a00cf118-5df4-42f7-af86-3e272d881631` | read / write | UTF-8 name, 1–20 printable ASCII |

Buzzes are capped at 2 s each (`MAX_BURST_MS`). A command that arrives while
the tag is already buzzing is ignored.

"Bluetooth frequency": BLE always uses the 2.4 GHz band and hops channels on its
own, so there's nothing to set. The two knobs that matter, advertising interval
(how fast phones find the tag vs. battery) and TX power (range), are in `config.h`.

## The buzzer test: does it sound lower with delayed inputs?

Same voltage the whole time; only the on/off timing changes. In the Serial Monitor:

```
hold            steady HIGH: the baseline
sweep           125 µs → 2500 µs delays, prints the frequency of each step
wave 500 500    one specific timing (here 1000 Hz)
wave 200 800    same period, less time on: compare the volume
```

What to expect depends on which buzzer you have:

- **Passive buzzer** (no sound on `hold`, or just a click): the delay *is* the
  pitch, `1,000,000 / (on + off)` Hz. Longer delays → clearly lower pitch. It's
  loudest around 2–4 kHz and gets quieter as you go lower.
- **Active buzzer** (beeps on `hold`): it has its own oscillator, so the pitch is
  fixed. Delays around its own frequency can make it sound rougher or buzzier.
  Long delays just chop it into a rattle or beeps. You won't get a clean lower note.

Quick way to tell them apart: an active buzzer is usually sealed underneath and
beeps on `hold`; a passive one shows a green circuit board underneath.
