export type NoiseSuppressionMode = 'disabled' | 'browser' | 'rnnoise' | 'gtcrn'

export function normalizeNoiseSuppressionMode(value: NoiseSuppressionMode | boolean): NoiseSuppressionMode {
  if (value === true)
    return 'browser'
  if (value === false)
    return 'disabled'
  if (value === 'disabled' || value === 'browser' || value === 'rnnoise' || value === 'gtcrn')
    return value
  return 'browser'
}

export function getAudioConstraints(
  deviceId: string,
  echoCancellation: boolean,
  noiseSuppression: NoiseSuppressionMode,
): MediaTrackConstraints {
  return {
    deviceId,
    echoCancellation,
    noiseSuppression: noiseSuppression === 'browser',
  }
}

export function usesWorkletNoiseSuppression(mode: NoiseSuppressionMode) {
  return mode === 'rnnoise' || mode === 'gtcrn'
}
