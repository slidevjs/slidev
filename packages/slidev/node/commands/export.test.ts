import { describe, expect, it } from 'vitest'
import { resolveExportDarkMode } from './export'

describe('resolveExportDarkMode', () => {
  it.each([
    ['light dark', false],
    ['dark light', true],
  ] as const)('uses the first scheme for "%s" when there is no override', (colorSchema, expected) => {
    expect(resolveExportDarkMode(undefined, colorSchema)).toBe(expected)
  })

  it.each([
    ['light dark', true, true],
    ['dark light', false, false],
  ] as const)('honors an explicit override for "%s"', (colorSchema, override, expected) => {
    expect(resolveExportDarkMode(override, colorSchema)).toBe(expected)
  })

  it.each([
    ['auto', false],
    ['light', false],
    ['dark', true],
  ] as const)('preserves the default for "%s"', (colorSchema, expected) => {
    expect(resolveExportDarkMode(undefined, colorSchema)).toBe(expected)
  })

  it.each([
    ['auto', true, true],
    ['light', true, true],
    ['dark', false, true],
  ] as const)('preserves existing override behavior for "%s"', (colorSchema, override, expected) => {
    expect(resolveExportDarkMode(override, colorSchema)).toBe(expected)
  })
})
