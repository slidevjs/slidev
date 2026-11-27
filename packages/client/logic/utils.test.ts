import { describe, expect, it } from 'vitest'
import { isPresentShortcut } from './utils'

describe('isPresentShortcut', () => {
  const key = (key: string, mods: { metaKey?: boolean, ctrlKey?: boolean } = {}) =>
    ({ key, metaKey: false, ctrlKey: false, ...mods })

  it('matches Google Slides present keys', () => {
    expect(isPresentShortcut(key('Enter', { metaKey: true }))).toBe(true)
    expect(isPresentShortcut(key('F5', { ctrlKey: true }))).toBe(true)
  })

  it('ignores other keys', () => {
    expect(isPresentShortcut(key('Enter'))).toBe(false)
    expect(isPresentShortcut(key('Enter', { ctrlKey: true }))).toBe(false)
    expect(isPresentShortcut(key('F5'))).toBe(false)
    expect(isPresentShortcut(key('F5', { metaKey: true }))).toBe(false)
  })
})
