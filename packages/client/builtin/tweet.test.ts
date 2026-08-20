import { describe, expect, it } from 'vitest'
import { resolveTweetId } from './tweet'

describe('resolveTweetId', () => {
  it('keeps the existing id input', () => {
    expect(resolveTweetId(123, undefined)).toBe('123')
    expect(resolveTweetId(' 456 ', undefined)).toBe('456')
  })

  it('prefers id when both inputs are present', () => {
    expect(resolveTweetId('123', 'https://x.com/slidevjs/status/456')).toBe('123')
  })

  it.each([
    'https://x.com/slidevjs/status/123',
    'https://www.x.com/slidevjs/status/123?s=20',
    'https://twitter.com/slidevjs/status/123',
    'https://mobile.twitter.com/slidevjs/status/123/photo/1',
    'https://x.com/i/web/status/123',
  ])('extracts an id from %s', (url) => {
    expect(resolveTweetId(undefined, url)).toBe('123')
  })

  it.each([
    'https://example.com/slidevjs/status/123',
    'https://x.com.example.com/slidevjs/status/123',
    'https://x.com/slidevjs/status/not-a-number',
    'javascript:alert(1)',
    'not a URL',
  ])('rejects an unsupported source URL: %s', (url) => {
    expect(resolveTweetId(undefined, url)).toBeUndefined()
  })
})
