import MarkdownIt from 'markdown-it'
import { describe, expect, it } from 'vitest'
import type { ResolvedFontOptions } from '../packages/parser/node_modules/@slidev/types'
import { parseAspectRatio, parseRangeString } from '../packages/parser/src'
import { generateGoogleFontsUrl, stringifyMarkdownTokens } from '../packages/slidev/node/utils'

describe('utils', () => {
  it('page-range', () => {
    expect(parseRangeString(5)).toEqual([1, 2, 3, 4, 5])
    expect(parseRangeString(5, 'all')).toEqual([1, 2, 3, 4, 5])
    expect(parseRangeString(2, '*')).toEqual([1, 2])
    expect(parseRangeString(5, '1')).toEqual([1])
    expect(parseRangeString(10, '1,2-3,5')).toEqual([1, 2, 3, 5])
    expect(parseRangeString(10, '1;2-3;5')).toEqual([1, 2, 3, 5])
    expect(parseRangeString(10, '6-')).toEqual([6, 7, 8, 9, 10])
  })

  it('aspect-ratio', () => {
    expect(parseAspectRatio(1)).toEqual(1)
    expect(parseAspectRatio('16/9')).toEqual(16 / 9)
    expect(parseAspectRatio('16 / 9 ')).toEqual(16 / 9)
    expect(parseAspectRatio('3:4')).toEqual(3 / 4)
    expect(parseAspectRatio('1x1')).toEqual(1)
    expect(parseAspectRatio('1')).toEqual(1)

    expect(() => parseAspectRatio('hello')).toThrow()
    expect(() => parseAspectRatio('1/0')).toThrow()
  })

  it('stringify-markdown-tokens', () => {
    const md = MarkdownIt({ html: true })
    const stringify = (src: string) => stringifyMarkdownTokens(md.parseInline(src, {}))

    expect(stringify('<span style="color:red">Composable</span> Vue')).toBe('Composable Vue')
    expect(stringify('<b>Whatever</b>')).toBe('Whatever')
    expect(stringify('Talk about `<details/>`')).toBe('Talk about <details/>')
    expect(stringify('What is Readonly\\<T\\> in TypeScript')).toBe('What is Readonly<T> in TypeScript')
    expect(stringify('Welcome to<br />*Slidev*')).toBe('Welcome to Slidev')
  })

  it('google-fonts', () => {
    expect(
      generateGoogleFontsUrl({
        webfonts: ['Fira Code', 'PT Serif'],
        weights: ['200', '400', '600'],
        provider: 'google',
      } as ResolvedFontOptions),
    ).toMatchSnapshot()

    expect(
      generateGoogleFontsUrl({
        webfonts: ['Fira Code', 'PT Serif'],
        weights: ['200', '400', '600'],
        italic: true,
        provider: 'google',
      } as ResolvedFontOptions),
    ).toMatchSnapshot()
  })
})
