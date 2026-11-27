import { describe, expect, it } from 'vitest'
import { isSafeDrawingKey } from './drawings'

describe('isSafeDrawingKey', () => {
  it('accepts numeric keys', () => expect(isSafeDrawingKey('/deck/.slidev/drawings', '3')).toBe(true))
  it('rejects traversal', () => expect(isSafeDrawingKey('/deck/.slidev/drawings', '../../evil')).toBe(false))
  it('rejects separators', () => expect(isSafeDrawingKey('/deck/.slidev/drawings', 'a/b')).toBe(false))
  it('rejects empty keys', () => expect(isSafeDrawingKey('/deck/.slidev/drawings', '')).toBe(false))
  it('rejects non-numeric keys', () => expect(isSafeDrawingKey('/deck/.slidev/drawings', 'abc')).toBe(false))
})
