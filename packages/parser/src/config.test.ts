import { describe, expect, it } from 'vitest'
import { resolveConfig, verifyConfig } from './config'

describe('resolveConfig colorSchema', () => {
  it.each(['light dark', 'dark light'] as const)('accepts "%s"', (colorSchema) => {
    expect(resolveConfig({ colorSchema }).colorSchema).toBe(colorSchema)
  })

  it.each(['auto', 'light', 'dark'] as const)('preserves "%s"', (colorSchema) => {
    expect(resolveConfig({ colorSchema }).colorSchema).toBe(colorSchema)
  })

  it('defaults to auto', () => {
    expect(resolveConfig({}).colorSchema).toBe('auto')
  })

  it('continues to use a single-scheme theme default when the configured scheme is auto', () => {
    expect(resolveConfig({ colorSchema: 'auto' }, { colorSchema: 'dark' }).colorSchema).toBe('dark')
  })
})

describe('verifyConfig colorSchema', () => {
  it.each([
    ['light', 'dark'],
    ['dark', 'light'],
    ['light dark', 'dark'],
    ['dark light', 'light'],
  ] as const)('warns when "%s" is used with a %s-only theme', (colorSchema, themeColorSchema) => {
    const config = resolveConfig({ colorSchema })
    const warnings: string[] = []

    verifyConfig(config, { colorSchema: themeColorSchema }, warning => warnings.push(warning))

    expect(warnings).toEqual([
      `Color schema "${colorSchema}" is not supported by the theme`,
    ])
  })

  it.each([
    ['light', 'light'],
    ['dark', 'dark'],
    ['light dark', 'both'],
    ['dark light', 'both'],
  ] as const)('does not warn when "%s" is supported by a %s theme', (colorSchema, themeColorSchema) => {
    const config = resolveConfig({ colorSchema })
    const warnings: string[] = []

    verifyConfig(config, { colorSchema: themeColorSchema }, warning => warnings.push(warning))

    expect(warnings).toEqual([])
  })
})
