import { PermissionsAndroid, Platform } from 'react-native';
import { BleManager, State, type Device } from 'react-native-ble-plx';
import { TRACKER_PROTOCOL as protocol } from './protocol';
import { smoothRssi, STALE_MS } from './domain';

export type DiscoveredTag = { id: string; name: string; rssi: number | null; observedAt: number };

export class ForegroundTracker {
  private manager: BleManager | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private generation = 0;
  private connection: Device | null = null;
  private signals = new Map<string, DiscoveredTag>();
  private ringGeneration = 0;
  private pendingDeviceId: string | null = null;
  private ringTimer: ReturnType<typeof setTimeout> | undefined;

  private getManager() { return this.manager ??= new BleManager(); }

  async scan(onTag: (tag: DiscoveredTag) => void, onStatus: (status: string) => void) {
    this.stop();
    const generation = this.generation;
    if (!protocol.serviceUUID) throw new Error('Tracker protocol is not configured. Add the firmware service UUID in src/history/protocol.ts and rebuild.');
    if (Platform.OS !== 'android') throw new Error('This demonstration requires a native Android build.');
    const permissions = Number(Platform.Version) >= 31
      ? [PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN, PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT]
      : [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
    const results = await PermissionsAndroid.requestMultiple(permissions);
    if (permissions.some(p => results[p] !== PermissionsAndroid.RESULTS.GRANTED)) {
      throw new Error('Allow Nearby devices in Android app settings, then try again. Older Android versions also require Location permission for BLE scanning.');
    }
    if (generation !== this.generation) return;
    const manager = this.getManager();
    if (await manager.state() !== State.PoweredOn) throw new Error('Turn on Bluetooth, then try scanning again.');
    if (generation !== this.generation) return;
    onStatus('Searching for 30 seconds…');
    await manager.startDeviceScan([protocol.serviceUUID], { allowDuplicates: true }, (error, device) => {
      if (generation !== this.generation) return;
      if (error) { this.stop(); onStatus(`Scan failed: ${error.message}`); return; }
      if (device) {
        const observedAt = Date.now();
        const prior = this.signals.get(device.id);
        const rssi = smoothRssi(prior && observedAt - prior.observedAt < STALE_MS ? prior.rssi : null, device.rssi);
        const tag = { id: device.id, name: device.localName || device.name || 'Supported tracker', rssi, observedAt };
        this.signals.set(device.id, tag);
        onTag(tag);
      }
    });
    this.timer = setTimeout(() => {
      this.stop();
      onStatus('Search ended. If no tracker appeared, check power, range and the configured firmware service.');
    }, 30_000);
  }

  stop() {
    this.generation++;
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    void this.manager?.stopDeviceScan().catch(() => {});
  }

  async ring(deviceId: string): Promise<string> {
    if (!protocol.serviceUUID || !protocol.ringCharacteristicUUID || !protocol.ringCommandBase64 || !protocol.firmwareBoundsRingDuration) {
      throw new Error('Ring is unavailable until the actual firmware command and firmware-enforced duration are configured.');
    }
    if (this.pendingDeviceId || this.connection) throw new Error('A ring command is already active. Wait for it to finish or use Stop.');
    this.stop();
    const manager = this.getManager();
    const generation = ++this.ringGeneration;
    this.pendingDeviceId = deviceId;
    let expired = false;
    let accepted = false;
    const canceled = () => expired || generation !== this.ringGeneration;
    const work = async () => {
      const device = await manager.connectToDevice(deviceId, { timeout: 8000 });
      if (canceled()) { await device.cancelConnection().catch(() => {}); throw new Error('Ring canceled or timed out.'); }
      this.connection = device;
      await device.discoverAllServicesAndCharacteristics();
      if (canceled()) throw new Error('Ring canceled or timed out.');
      await device.writeCharacteristicWithResponseForService(protocol.serviceUUID, protocol.ringCharacteristicUUID, protocol.ringCommandBase64);
      if (canceled()) throw new Error('Ring canceled. Buzzer sound is unconfirmed.');
      accepted = true;
      return 'Command accepted by Bluetooth. Buzzer sound has not been confirmed; listen to verify.';
    };
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([work(), new Promise<never>((_, reject) => {
        timeout = setTimeout(() => { expired = true; void manager.cancelDeviceConnection(deviceId).catch(() => {}); reject(new Error('Ring timed out. Buzzer sound is unconfirmed.')); }, 10_000);
      })]);
    } finally {
      if (timeout) clearTimeout(timeout);
      if (generation === this.ringGeneration) {
        if (accepted) {
          // Scope cleanup to this attempt; it must never disconnect a later ring.
          this.ringTimer = setTimeout(() => {
            if (generation === this.ringGeneration) void this.disconnect();
          }, protocol.ringDurationMs + 500);
        } else await this.disconnect();
      }
    }
  }

  async stopRing() {
    if (!this.connection || !protocol.stopCommandBase64) throw new Error('Stop is not supported by the configured firmware.');
    await this.connection.writeCharacteristicWithResponseForService(protocol.serviceUUID, protocol.ringCharacteristicUUID, protocol.stopCommandBase64);
    await this.disconnect();
  }

  async disconnect() {
    this.ringGeneration++;
    if (this.ringTimer) clearTimeout(this.ringTimer);
    this.ringTimer = undefined;
    const device = this.connection;
    const pendingDeviceId = this.pendingDeviceId;
    this.connection = null;
    this.pendingDeviceId = null;
    if (device) await device.cancelConnection().catch(() => {});
    else if (pendingDeviceId) await this.manager?.cancelDeviceConnection(pendingDeviceId).catch(() => {});
  }
  dispose() { this.stop(); void this.disconnect(); void this.manager?.destroy(); this.manager = null; }
}
