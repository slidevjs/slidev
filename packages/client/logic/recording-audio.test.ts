import type { NoiseSuppressionMode } from './recording-audio'
import { describe, expect, it } from 'vitest'
import { getAudioConstraints, normalizeNoiseSuppressionMode, usesWorkletNoiseSuppression } from './recording-audio'

describe('getAudioConstraints', () => {
  it.each<[NoiseSuppressionMode, boolean]>([
    ['disabled', false],
    ['browser', true],
    ['rnnoise', false],
    ['gtcrn', false],
  ])('maps %s to the browser noise suppression constraint', (mode, noiseSuppression) => {
    expect(getAudioConstraints('microphone-1', true, mode)).toEqual({
      deviceId: 'microphone-1',
      echoCancellation: true,
      noiseSuppression,
    })
  })
})

describe('usesWorkletNoiseSuppression', () => {
  it.each<NoiseSuppressionMode>(['disabled', 'browser'])('does not use a worklet for %s', (mode) => {
    expect(usesWorkletNoiseSuppression(mode)).toBe(false)
  })

  it.each<NoiseSuppressionMode>(['rnnoise', 'gtcrn'])('uses a worklet for %s', (mode) => {
    expect(usesWorkletNoiseSuppression(mode)).toBe(true)
  })
})

describe('normalizeNoiseSuppressionMode', () => {
  it.each([
    [true, 'browser'],
    [false, 'disabled'],
    ['browser', 'browser'],
    ['rnnoise', 'rnnoise'],
    ['gtcrn', 'gtcrn'],
    ['unexpected' as any, 'browser'],
  ])('normalizes %s to %s', (value, expected) => {
    expect(normalizeNoiseSuppressionMode(value)).toBe(expected)
  })
})
