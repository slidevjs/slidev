import type { ResolvedFontOptions, SlideInfo } from '@slidev/types'
import { relative, resolve } from 'node:path'
import { slash } from '@antfu/utils'
import MarkdownIt from 'markdown-it'
import { describe, expect, it } from 'vitest'
import YAML from 'yaml'
import { parseAspectRatio, parseRangeString } from '../packages/parser/src'
import { getRoots } from '../packages/slidev/node/resolver'
import { generateGoogleFontsUrl, stringifyMarkdownTokens, updateFrontmatterPatch } from '../packages/slidev/node/utils'

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

  it('roots', async () => {
    const { cliRoot, clientRoot, userRoot, userWorkspaceRoot } = await getRoots(resolve('slides.md'))
    const expectRelative = (v: string) => expect(slash(relative(__dirname, v)))
    expectRelative(cliRoot).toMatchInlineSnapshot(`"../packages/slidev"`)
    expectRelative(clientRoot).toMatchInlineSnapshot(`"../packages/client"`)
    expectRelative(userRoot).toMatchInlineSnapshot(`".."`)
    expectRelative(userWorkspaceRoot).toMatchInlineSnapshot(`".."`)
  })

  it('update frontmatter patch', async () => {
    const dragPos = {
      foo: '1,2,3,4',
    }
    function createFakeSource(yaml: string) {
      const doc = YAML.parseDocument(yaml)
      return {
        frontmatter: {},
        source: {
          frontmatter: doc.toJSON() || {},
          frontmatterRaw: yaml,
          frontmatterDoc: doc,
        },
      } as SlideInfo
    }
    function expectFrontmatter(slide: SlideInfo) {
      return expect(slide.source.frontmatterDoc?.toString())
    }

    const slide1 = createFakeSource(``)
    updateFrontmatterPatch(slide1, { dragPos })
    expectFrontmatter(slide1).toMatchInlineSnapshot(`
      "dragPos:
        foo: 1,2,3,4
      "
    `)

    const slide2 = createFakeSource(`
      # comment
      title: Hello  # another comment
      dragPos:
        bar: 5,6,7,8
    `)
    updateFrontmatterPatch(slide2, { dragPos })
    expectFrontmatter(slide2).toMatchInlineSnapshot(`
      "# comment
      title: Hello # another comment
      dragPos:
        foo: 1,2,3,4
      "
    `)

    // remove a field
    const slide3 = createFakeSource(`
      # comment
      title: Hello  # another comment
      dragPos:
        bar: 5,6,7,8
    `)
    updateFrontmatterPatch(slide3, { title: null })
    expectFrontmatter(slide3).toMatchInlineSnapshot(`
      "dragPos:
        bar: 5,6,7,8
      "
    `)
  })
})
