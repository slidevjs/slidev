import type { Connect } from 'vite'
import { Buffer } from 'node:buffer'
import { Readable } from 'node:stream'
import { describe, expect, it } from 'vitest'
import { applyNotesAutoRuby, getBodyJson, isPathInsideRoots } from './utils'

describe('isPathInsideRoots', () => {
  it('accepts a path nested inside a root', () => {
    expect(isPathInsideRoots('/a/b/c', ['/a'])).toBe(true)
  })

  it('accepts a path that equals the root itself', () => {
    expect(isPathInsideRoots('/a', ['/a'])).toBe(true)
  })

  it('rejects a path outside every root', () => {
    expect(isPathInsideRoots('/x', ['/a'])).toBe(false)
  })

  it('rejects a `..`-escaping relative resolution', () => {
    expect(isPathInsideRoots('/a/../x', ['/a'])).toBe(false)
  })

  it('accepts when any of several roots contains the path', () => {
    expect(isPathInsideRoots('/b/c', ['/a', '/b'])).toBe(true)
  })
})

describe('applyNotesAutoRuby', () => {
  it('wraps a matched key in a ruby tag', () => {
    expect(applyNotesAutoRuby('私は勉強しています。', { 勉強: 'べんきょう' }))
      .toBe('私は<ruby>勉強<rt>べんきょう</rt></ruby>しています。')
  })

  it('prefers the longest key when one key starts with another', () => {
    expect(applyNotesAutoRuby('私は日本語を話す', { 日本: 'ni hon', 日本語: 'ni hon go' }))
      .toBe('私は<ruby>日本語<rt>ni hon go</rt></ruby>を話す')
  })

  it('matches keys containing regular expression characters literally', () => {
    expect(applyNotesAutoRuby('I write C++ code', { 'C++': 'see plus plus' }))
      .toBe('I write <ruby>C++<rt>see plus plus</rt></ruby> code')
    expect(applyNotesAutoRuby('the (foo) case', { '(foo)': 'ふー' }))
      .toBe('the <ruby>(foo)<rt>ふー</rt></ruby> case')
  })

  it('only matches whole words for alphanumeric keys', () => {
    expect(applyNotesAutoRuby('slidev slidevjs', { slidev: 'slide dev' }))
      .toBe('<ruby>slidev<rt>slide dev</rt></ruby> slidevjs')
  })

  it('returns the input untouched when there is no key', () => {
    expect(applyNotesAutoRuby('unchanged', {})).toBe('unchanged')
  })
})

describe('getBodyJson', () => {
  function request(...chunks: Buffer[]) {
    return Readable.from(chunks, { objectMode: false }) as Connect.IncomingMessage
  }

  it('parses a body that is split inside a character', async () => {
    const body = Buffer.from(JSON.stringify({ note: '日本語' }))
    for (let i = 1; i < body.length; i++) {
      expect(await getBodyJson(request(body.subarray(0, i), body.subarray(i))))
        .toEqual({ note: '日本語' })
    }
  })

  it('rejects a body that is not JSON', async () => {
    await expect(getBodyJson(request(Buffer.from('{')))).rejects.toThrow(SyntaxError)
  })
})
