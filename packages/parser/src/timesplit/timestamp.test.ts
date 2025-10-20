import { describe, expect, it } from 'vitest'
import { parseTimestampString } from './timestamp'

describe('parseTimestampString', () => {
  it('should parse timestamp into seconds', () => {
    expect(parseTimestampString('10:50.1')).toEqual({ seconds: 650.1, relative: false })
    expect(parseTimestampString('10s')).toEqual({ seconds: 10, relative: false })
    expect(parseTimestampString('5m')).toEqual({ seconds: 300, relative: false })
    expect(parseTimestampString('3min')).toEqual({ seconds: 180, relative: false })
    expect(parseTimestampString('3mins 5secs')).toEqual({ seconds: 185, relative: false })
    expect(parseTimestampString('10.5m3s')).toEqual({ seconds: 633, relative: false })
    expect(parseTimestampString('+10s')).toEqual({ seconds: 10, relative: true })
    expect(parseTimestampString('1h10m30s')).toEqual({ seconds: 4230, relative: false })
    expect(parseTimestampString('1h4s')).toEqual({ seconds: 3604, relative: false })
    expect(parseTimestampString('1:1:1')).toEqual({ seconds: 3661, relative: false })
    expect(parseTimestampString('0.5years')).toEqual({ seconds: 15778476, relative: false })
  })

  it('should throw an error for invalid timestamp', () => {
    expect(() => parseTimestampString('10x')).toThrow('Invalid timestamp unit: x')
    expect(() => parseTimestampString('10h:10m:10s')).toThrow('Invalid timestamp format')
    expect(() => parseTimestampString('hello 1s world')).toThrow('Unknown timestamp remaining: hello  world')
  })
})
