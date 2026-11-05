import { describe, expect, it } from 'vitest'
import { resolveFonts } from './config'

describe('resolveFonts', () => {
  it('defaults the body font role to sans', () => {
    const fonts = resolveFonts()

    expect(fonts.body).toBe('sans')
    expect(fonts.body && fonts[fonts.body]).toEqual(fonts.sans)
  })

  it('supports serif as the body font role', () => {
    const fonts = resolveFonts({
      body: 'serif',
      sans: 'Inter',
      serif: 'Merriweather',
      mono: 'Fira Code',
    })

    expect(fonts.body).toBe('serif')
    expect(fonts[fonts.body]).toEqual(fonts.serif)
    expect(fonts.serif[0]).toBe('"Merriweather"')
  })

  it('supports mono as the body font role', () => {
    const fonts = resolveFonts({
      body: 'mono',
      sans: 'Inter',
      serif: 'Merriweather',
      mono: 'Fira Code',
    })

    expect(fonts.body).toBe('mono')
    expect(fonts[fonts.body]).toEqual(fonts.mono)
    expect(fonts.mono[0]).toBe('"Fira Code"')
  })

  it('preserves the sans, serif, and mono stacks independently', () => {
    const fonts = resolveFonts({
      body: 'serif',
      sans: 'Inter',
      serif: 'Merriweather',
      mono: 'Fira Code',
    })

    expect(fonts.sans[0]).toBe('"Inter"')
    expect(fonts.serif[0]).toBe('"Merriweather"')
    expect(fonts.mono[0]).toBe('"Fira Code"')
  })

  it('keeps the configured font stack when fallbacks are disabled', () => {
    const fonts = resolveFonts({
      body: 'serif',
      serif: 'Merriweather',
      fallbacks: false,
    })

    expect(fonts.body).toBe('serif')
    expect(fonts.serif).toEqual(['Merriweather'])
  })
})
