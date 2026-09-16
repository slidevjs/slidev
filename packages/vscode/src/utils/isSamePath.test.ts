import { describe, expect, it } from 'vitest'
import { isSamePath } from './isSamePath'

describe('isSamePath', () => {
  it('compares Windows absolute paths case-insensitively', () => {
    expect(isSamePath('c:\\work\\deck\\slides.md', 'C:/Work/Deck/slides.md')).toBe(true)
  })

  it('normalizes Windows path separators', () => {
    expect(isSamePath('C:\\Work/Deck\\slides.md', 'c:/work\\deck/slides.md')).toBe(true)
  })

  it('keeps distinct Windows paths separate', () => {
    expect(isSamePath('C:/Work/Deck/slides.md', 'C:/Work/Other/slides.md')).toBe(false)
  })

  it('compares POSIX paths case-sensitively', () => {
    expect(isSamePath('/work/deck/slides.md', '/Work/Deck/slides.md')).toBe(false)
  })
})
