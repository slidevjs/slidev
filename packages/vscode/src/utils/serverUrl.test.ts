import { describe, expect, it } from 'vitest'
import { getDetectUrls, getServerUrl } from './serverUrl'

describe('getServerUrl', () => {
  it('defaults to localhost', () => {
    expect(getServerUrl('localhost', 3030)).toBe('http://localhost:3030')
    expect(getServerUrl('', 3030)).toBe('http://localhost:3030')
    expect(getServerUrl('  ', 3030)).toBe('http://localhost:3030')
  })

  it('uses a custom host', () => {
    expect(getServerUrl('192.168.1.20', 3030)).toBe('http://192.168.1.20:3030')
    expect(getServerUrl(' slides.example.com ', 4000)).toBe('http://slides.example.com:4000')
  })

  it('wraps IPv6 addresses in brackets', () => {
    expect(getServerUrl('::1', 3030)).toBe('http://[::1]:3030')
    expect(getServerUrl('[fe80::1]', 3030)).toBe('http://[fe80::1]:3030')
  })
})

describe('getDetectUrls', () => {
  it('probes both loopback addresses for localhost', () => {
    expect(getDetectUrls('localhost', 3030)).toEqual([
      'http://[::1]:3030',
      'http://127.0.0.1:3030',
    ])
    expect(getDetectUrls('', 3030)).toEqual([
      'http://[::1]:3030',
      'http://127.0.0.1:3030',
    ])
  })

  it('probes only the configured host otherwise', () => {
    expect(getDetectUrls('192.168.1.20', 3030)).toEqual(['http://192.168.1.20:3030'])
  })
})
