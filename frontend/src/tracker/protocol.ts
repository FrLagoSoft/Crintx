/** Fill only from the team's actual firmware. Never guess a ring payload. */
export const TRACKER_PROTOCOL = {
  serviceUUID: '',
  ringCharacteristicUUID: '',
  // A firmware-enforced bounded-duration command, encoded as base64.
  ringCommandBase64: '',
  stopCommandBase64: '',
  ringDurationMs: 3000,
  firmwareBoundsRingDuration: false,
};
