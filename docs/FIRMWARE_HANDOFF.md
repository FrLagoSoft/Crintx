> Integration status (September 26, 2026): Tracker work is now layered onto origin/main at 66dd14e. Main's existing screens, firmware, BLE flow and AI test are retained. Open Setup → Open recovery history for the added local workflow. The strict offline manifest plugin is preserved but NOT enabled in this combined prototype: existing networking, GPS and model download remain available. App-wide offline/backup guarantees are therefore pending a separate integration decision. Regenerate native projects before building; old generated Android files and earlier export results are not evidence for this combined version.

# ESP32 firmware handoff — real hardware pending

Target reported by the team: ESP32-WROOM-32E on a DevKitC-style clone, CP2102 USB serial, attached working buzzer. The Inland ATmega32U4 Pro Micro is not a BLE receiver/tag in this demo. No boards have been flashed or physically tested here.

The app intentionally sends **no guessed command**. The current statement “buzzes when it receives any signal” does not establish a BLE GATT write protocol; it could describe serial, Wi-Fi, or a different event.

## Exact information needed from the firmware owner

1. Supply the current Arduino sketch or ESP-IDF source, including any custom BLE library dependencies.
2. Identify the advertised service UUID and how to distinguish this tag from another tag. Prefer a stable non-personal ID in manufacturer/service data or a readable characteristic; a rotating address is not a durable identity.
3. Identify the writable ring characteristic UUID, exact command bytes, write-with-response support, and any application acknowledgement characteristic/payload.
4. Confirm a short firmware-enforced ring timeout (initial app duration is 3 seconds). A client disconnect must not leave the buzzer on indefinitely. Provide a stop payload if supported.
5. Identify pairing/bonding/encryption or another command authorization mechanism. Do not describe an unauthenticated public GATT write as secure.
6. State buzzer type, GPIO pin, and active-high/active-low behavior for the physical tester. No GPIO assumptions are used in this app.

Then fill `frontend/src/history/protocol.ts` with the **actual** UUIDs and base64-encoded payloads; set `firmwareBoundsRingDuration` only after inspecting/testing that behavior. Rebuild the APK. No UUID or payload has been proposed as if it were established hardware behavior.

## Current adapter behavior

- Android foreground only, user-triggered 30-second filtered scan. Stops on screen exit and app inactivity. Requires Nearby devices on Android 12+; older Android needs BLE location permission. Never requests GPS coordinates.
- RSSI exponentially smoothed (70% previous/30% new), no meters, direction or automatically identified room. Signal expires at 15 seconds without observations. Calibrate thresholds only with the physical board/phone; none are claimed now.
- Association has a local item UUID plus a Bluetooth address hint. Address rotation/replacement currently requires reassociation; a stable firmware ID remains an integration task.
- Ring connects with an 8-second connection timeout, discovers services, writes with GATT response and has a 10-second overall timeout. Success wording confirms Bluetooth acceptance only, never audible sound. Firmware bounds duration. Optional stop command supported.
- No automatic reconnect loop, background separation alerts, public item-name advertisement or device firmware updates.

## Physical verification worksheet

Record phone model/OS, board sketch revision, service/characteristic UUIDs and command format. With phone internet off and Bluetooth on:

- Discover the real board and associate an item.
- Turn the board off; ensure detection expires honestly within 15 seconds of the last observation.
- Ring and listen; record whether sound occurs and stops within the configured bound.
- Exercise permission denial, Bluetooth off, out-of-range, reconnect, Stop (if supported), screen exit and app backgrounding.
- Reboot the tag to check association stability. Test unauthorized-command behavior separately.

The simulation lab and automated tests cannot certify any of these physical behaviors.
